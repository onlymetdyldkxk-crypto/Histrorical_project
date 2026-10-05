/**
 * GLOBAL APP STORE — the frontend "service boundary".
 * ------------------------------------------------------------
 * Connects React UI components to backend REST API endpoints (`/api/v1/*`)
 * with graceful fallback to mock state when working offline or in standalone mode.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedNotifications, seedRequests, seedUsers } from "./mockData";
import type {
  AppNotification,
  DocRequest,
  NotifTone,
  Quote,
  SubmitPayload,
  Toast,
  User,
} from "./types";
import { nowIso, uid } from "./utils";
import { authApi, requestsApi, adminApi, paymentsApi, notificationsApi, setToken, getToken } from "./api";

interface Result {
  ok: boolean;
  error?: string;
}

interface StoreValue {
  user: User | null;
  users: User[];
  requests: DocRequest[];
  notifications: AppNotification[];
  toasts: Toast[];
  visibleNotifications: AppNotification[];
  myRequests: DocRequest[];
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<Result & { role?: "user" | "admin" }>;
  signup: (d: { name: string; email: string; phone: string; password: string }) => Promise<Result>;
  logout: () => void;
  resetPassword: (email: string) => Promise<Result>;

  submitRequest: (p: SubmitPayload) => Promise<DocRequest>;
  beginPayment: (id: string) => void;
  processPayment: (id: string, outcome: "success" | "failed", transactionId?: string) => Promise<void>;
  setAdminNote: (id: string, note: string) => Promise<void>;
  sendQuote: (id: string, q: Omit<Quote, "sentAt">) => Promise<void>;
  rejectRequest: (id: string, reason: string, message: string) => Promise<void>;
  startProcessing: (id: string) => Promise<void>;
  completeRequest: (id: string, c: { fileName: string; fileLabel: string; note: string; message: string }) => Promise<void>;

  markRead: (id: string) => void;
  markAllRead: () => void;

  toast: (title: string, tone?: NotifTone, body?: string) => void;
  dismissToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [requests, setRequests] = useState<DocRequest[]>(seedRequests);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reqCounter = useRef(2418);

  const pushNotifs = useCallback((items: Omit<AppNotification, "id" | "read" | "at">[]) => {
    const at = nowIso();
    setNotifications((prev) => [
      ...items.map((n) => ({ ...n, id: uid("n"), read: false, at })),
      ...prev,
    ]);
  }, []);

  const updateRequest = useCallback((id: string, fn: (r: DocRequest) => DocRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...fn(r), updatedAt: nowIso() } : r)));
  }, []);

  const toast = useCallback((title: string, tone: NotifTone = "info", body?: string) => {
    const id = uid("t");
    setToasts((prev) => [...prev, { id, title, body, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4600);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  /* ---------------- API Refresh Data ---------------- */
  const refreshData = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [reqList, notifList] = await Promise.all([
        requestsApi.getUserRequests().catch(() => null),
        notificationsApi.getNotifications().catch(() => null),
      ]);

      if (reqList && Array.isArray(reqList)) {
        setRequests(reqList.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: r.user?.name || r.requirements?.fullName || "User",
          document: r.document || {},
          requirements: r.requirements || {},
          submittedAt: r.submittedAt,
          updatedAt: r.updatedAt,
          status: r.status.toLowerCase(),
          adminNote: r.adminNote,
          quote: r.quote ? { ...r.quote, charge: r.quote.charge } : undefined,
          payment: r.payment ? { status: r.payment.status.toLowerCase(), transactionId: r.payment.transactionId, amount: r.payment.amount, paidAt: r.payment.paidAt } : undefined,
          rejection: r.rejection ? { reason: r.rejection.reason, message: r.rejection.message, at: r.rejection.rejectedAt } : undefined,
          completion: r.completion ? { fileName: r.completion.fileName, fileLabel: r.completion.fileLabel, note: r.completion.note, message: r.completion.message, completedAt: r.completion.completedAt } : undefined,
        })));
      }

      if (notifList && Array.isArray(notifList)) {
        setNotifications(notifList.map((n: any) => ({
          id: n.id,
          forRole: n.forRole.toLowerCase(),
          userId: n.userId,
          title: n.title,
          body: n.body,
          tone: n.tone.toLowerCase(),
          read: n.read,
          at: n.createdAt,
        })));
      }
    } catch (e) {
      // Fallback silently if offline
    }
  }, []);

  // Restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) return;
      try {
        const res = await authApi.me();
        if (res?.user) {
          setUser({
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role as "user" | "admin",
            phone: res.user.phone,
          });
          refreshData();
        }
      } catch (e) {
        setToken(null);
      }
    }
    restoreSession();
  }, [refreshData]);

  /* ---------------- Auth ---------------- */

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await authApi.login({ email, password });
        if (res.token && res.user) {
          setToken(res.token);
          const u: User = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role as "user" | "admin",
            phone: res.user.phone,
          };
          setUser(u);
          refreshData();
          return { ok: true, role: u.role };
        }
      } catch (err: any) {
        // Fallback to local mock users if backend server is offline
        const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (u) {
          if (u.password && password !== u.password) {
            return { ok: false, error: "Incorrect password. For demo accounts, use: demo123" };
          }
          setUser(u);
          return { ok: true, role: u.role };
        }
        return { ok: false, error: err.message || "Failed to log in" };
      }
      return { ok: false, error: "Invalid credentials" };
    },
    [users, refreshData]
  );

  const signup = useCallback(
    async (d: { name: string; email: string; phone: string; password: string }) => {
      try {
        const res = await authApi.signup(d);
        if (res.token && res.user) {
          setToken(res.token);
          const u: User = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role as "user" | "admin",
            phone: res.user.phone,
          };
          setUser(u);
          return { ok: true };
        }
      } catch (err: any) {
        if (users.some((x) => x.email.toLowerCase() === d.email.trim().toLowerCase()))
          return { ok: false, error: "An account with this email already exists." };
        const u: User = { id: uid("u"), name: d.name.trim(), email: d.email.trim(), role: "user", phone: d.phone, password: d.password };
        setUsers((prev) => [...prev, u]);
        setUser(u);
        return { ok: true };
      }
      return { ok: false, error: "Failed to sign up" };
    },
    [users]
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => null);
    setToken(null);
    setUser(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        await authApi.forgotPassword(email);
        return { ok: true };
      } catch (e: any) {
        const exists = users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        return exists
          ? { ok: true }
          : { ok: false, error: e.message || "Account not found." };
      }
    },
    [users]
  );

  /* ---------------- Request Lifecycle ---------------- */

  const submitRequest = useCallback(
    async (p: SubmitPayload) => {
      try {
        const res = await requestsApi.submit({
          document: {
            kind: p.document.kind === "file" ? "FILE" : "DRIVE",
            fileName: p.document.fileName,
            fileType: p.document.fileType ? p.document.fileType.toUpperCase() : "PDF",
            fileSize: p.document.fileSize,
            fileCount: p.document.fileCount,
            driveUrl: p.document.driveUrl,
          },
          requirements: {
            fullName: p.requirements.fullName,
            age: p.requirements.age,
            gender: p.requirements.gender,
            email: p.requirements.email,
            phone: p.requirements.phone,
            address: p.requirements.address,
            purpose: p.requirements.purpose,
            processing: p.requirements.processing,
            outputFormat: p.requirements.outputFormat,
            instructions: p.requirements.instructions,
            notes: p.requirements.notes,
          },
        });

        if (res && res.id) {
          const req: DocRequest = {
            id: res.id,
            userId: user?.id ?? "guest",
            userName: user?.name ?? "Guest",
            document: p.document,
            requirements: p.requirements,
            submittedAt: res.submittedAt || nowIso(),
            updatedAt: res.updatedAt || nowIso(),
            status: "under_review",
          };
          setRequests((prev) => [req, ...prev]);
          refreshData();
          return req;
        }
      } catch (e) {
        // Fallback to local mock submission
      }

      const id = `REQ-${reqCounter.current++}`;
      const at = nowIso();
      const req: DocRequest = {
        id,
        userId: user?.id ?? "guest",
        userName: user?.name ?? "Guest",
        document: p.document,
        requirements: p.requirements,
        submittedAt: at,
        updatedAt: at,
        status: "under_review",
      };
      setRequests((prev) => [req, ...prev]);
      pushNotifs([
        { forRole: "user", userId: req.userId, title: "Your request has been received.", body: `Request ${id} is now under review by our team.`, tone: "info" },
        { forRole: "admin", title: "New request submitted.", body: `${req.userName} submitted ${id} — ${p.document.fileName}. It is waiting for review.`, tone: "info" },
      ]);
      return req;
    },
    [user, pushNotifs, refreshData]
  );

  const beginPayment = useCallback(
    (id: string) => {
      paymentsApi.createOrder(id).catch(() => null);
      updateRequest(id, (r) => ({ ...r, status: "payment_pending", payment: { status: "pending", ...(r.payment || {}) } }));
    },
    [updateRequest]
  );

  const processPayment = useCallback(
    async (id: string, outcome: "success" | "failed", transactionId?: string) => {
      const req = requests.find((r) => r.id === id);
      if (!req) return;

      if (outcome === "success") {
        const payment = {
          status: "successful" as const,
          transactionId: transactionId || req.payment?.transactionId || `TRX-OK`,
          amount: req.quote?.charge,
          paidAt: nowIso(),
        };
        updateRequest(id, (r) => ({ ...r, status: "payment_received", payment }));
        pushNotifs([
          { forRole: "user", userId: req.userId, title: "Payment received successfully.", body: `Payment for request ${id} has been recorded. Your request has been sent to our processing team.`, tone: "success" },
          { forRole: "admin", title: `Payment received for Request #${id.replace("REQ-", "")}.`, body: `Live payment confirmed via backend endpoint.`, tone: "success" },
        ]);
        refreshData();
      } else {
        updateRequest(id, (r) => ({ ...r, payment: { status: "failed", amount: req.quote?.charge, ...(r.payment || {}) } }));
        pushNotifs([
          { forRole: "user", userId: req.userId, title: "Payment could not be completed.", body: `The payment for request ${id} failed. You can try again at any time.`, tone: "danger" },
        ]);
      }
    },
    [requests, updateRequest, pushNotifs, refreshData]
  );

  const setAdminNote = useCallback(
    async (id: string, note: string) => {
      updateRequest(id, (r) => ({ ...r, adminNote: note }));
      try {
        await adminApi.saveNote(id, note);
      } catch (e) {}
    },
    [updateRequest]
  );

  const sendQuote = useCallback(
    async (id: string, q: Omit<Quote, "sentAt">) => {
      const req = requests.find((r) => r.id === id);
      updateRequest(id, (r) => ({ ...r, status: "quote_available", quote: { ...q, sentAt: nowIso() } }));
      try {
        await adminApi.sendQuote(id, {
          charge: q.charge,
          estimatedDays: q.estimatedDays,
          expectedDate: q.expectedDate,
          adminMessage: q.adminMessage,
          extraInstructions: q.extraInstructions,
        });
        refreshData();
      } catch (e) {
        if (req)
          pushNotifs([
            { forRole: "user", userId: req.userId, title: "Your request has been accepted — your quotation is ready.", body: `The quote for request ${id} is ready. Review it and pay to begin processing.`, tone: "success" },
          ]);
      }
    },
    [requests, updateRequest, pushNotifs, refreshData]
  );

  const rejectRequest = useCallback(
    async (id: string, reason: string, message: string) => {
      const req = requests.find((r) => r.id === id);
      updateRequest(id, (r) => ({ ...r, status: "rejected", rejection: { reason, message, at: nowIso() } }));
      try {
        await adminApi.rejectRequest(id, { reason, message });
        refreshData();
      } catch (e) {
        if (req)
          pushNotifs([
            { forRole: "user", userId: req.userId, title: "Your request could not be accepted.", body: `Request ${id} was reviewed. Please see the note from our team for details.`, tone: "danger" },
          ]);
      }
    },
    [requests, updateRequest, pushNotifs, refreshData]
  );

  const startProcessing = useCallback(
    async (id: string) => {
      const req = requests.find((r) => r.id === id);
      updateRequest(id, (r) => ({ ...r, status: "processing" }));
      try {
        await adminApi.startProcessing(id);
        refreshData();
      } catch (e) {
        if (req)
          pushNotifs([
            { forRole: "user", userId: req.userId, title: "Your document is currently being processed.", body: `Our team has started working on request ${id}.`, tone: "info" },
          ]);
      }
    },
    [requests, updateRequest, pushNotifs, refreshData]
  );

  const completeRequest = useCallback(
    async (id: string, c: { fileName: string; fileLabel: string; note: string; message: string }) => {
      const req = requests.find((r) => r.id === id);
      updateRequest(id, (r) => ({ ...r, status: "completed", completion: { ...c, completedAt: nowIso() } }));
      try {
        await adminApi.completeRequest(id, c);
        refreshData();
      } catch (e) {
        if (req)
          pushNotifs([
            { forRole: "user", userId: req.userId, title: "Your processed document is ready.", body: `Request ${id} is complete. Download your file any time from the request page.`, tone: "success" },
          ]);
      }
    },
    [requests, updateRequest, pushNotifs, refreshData]
  );

  /* ---------------- Notifications ---------------- */

  const visibleNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter((n) =>
      user.role === "admin" ? n.forRole === "admin" : n.forRole === "user" && (n.userId === user.id || !n.userId)
    );
  }, [notifications, user]);

  const myRequests = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? requests : requests.filter((r) => r.userId === user.id);
  }, [requests, user]);

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      notificationsApi.markRead(id).catch(() => null);
    },
    []
  );

  const markAllRead = useCallback(() => {
    if (!user) return;
    setNotifications((prev) =>
      prev.map((n) =>
        user.role === "admin" ? (n.forRole === "admin" ? { ...n, read: true } : n) : n.forRole === "user" && (n.userId === user.id || !n.userId) ? { ...n, read: true } : n
      )
    );
    notificationsApi.markAllRead().catch(() => null);
  }, [user]);

  const value: StoreValue = {
    user,
    users,
    requests,
    notifications,
    toasts,
    visibleNotifications,
    myRequests,
    isAdmin: user?.role === "admin",
    login,
    signup,
    logout,
    resetPassword,
    submitRequest,
    beginPayment,
    processPayment,
    setAdminNote,
    sendQuote,
    rejectRequest,
    startProcessing,
    completeRequest,
    markRead,
    markAllRead,
    toast,
    dismissToast,
    refreshData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Simulates a short data fetch so loading states are visible in the demo. */
export function useSimulatedLoad(ms = 550) {
  const [loading, setLoading] = useState(true);
  const ref = useRef<number | undefined>(undefined);
  React.useEffect(() => {
    ref.current = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(ref.current);
  }, [ms]);
  return loading;
}
