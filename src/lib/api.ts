const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api/v1";

const TOKEN_KEY = "archive_auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || `API error (${response.status})`);
  }

  return data.data;
}

export const authApi = {
  signup: (payload: any) => apiFetch<{ token: string; user: any }>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: any) => apiFetch<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) => apiFetch<void>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => apiFetch<void>("/auth/reset-password", { method: "POST", body: JSON.stringify(payload) }),
  me: () => apiFetch<{ user: any }>("/auth/me"),
};

export const requestsApi = {
  submit: (payload: any) => apiFetch<any>("/requests", { method: "POST", body: JSON.stringify(payload) }),
  getUserRequests: () => apiFetch<any[]>("/requests"),
  getById: (id: string) => apiFetch<any>(`/requests/${id}`),
  getQuote: (id: string) => apiFetch<any>(`/requests/${id}/quote`),
};

export const adminApi = {
  getOverview: () => apiFetch<any>("/admin/overview"),
  getAllRequests: (params?: { q?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<any[]>(`/admin/requests${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => apiFetch<any>(`/admin/requests/${id}`),
  saveNote: (id: string, note: string) => apiFetch<any>(`/admin/requests/${id}/note`, { method: "PUT", body: JSON.stringify({ note }) }),
  sendQuote: (id: string, payload: any) => apiFetch<any>(`/admin/requests/${id}/quote`, { method: "POST", body: JSON.stringify(payload) }),
  rejectRequest: (id: string, payload: any) => apiFetch<any>(`/admin/requests/${id}/reject`, { method: "POST", body: JSON.stringify(payload) }),
  startProcessing: (id: string) => apiFetch<any>(`/admin/requests/${id}/start-processing`, { method: "POST" }),
  completeRequest: (id: string, payload: any) => apiFetch<any>(`/admin/requests/${id}/complete`, { method: "POST", body: JSON.stringify(payload) }),
};

export const paymentsApi = {
  createOrder: (requestId: string) => apiFetch<any>("/payments/create-order", { method: "POST", body: JSON.stringify({ requestId }) }),
  verifyPayment: (payload: any) => apiFetch<any>("/payments/verify", { method: "POST", body: JSON.stringify(payload) }),
  getAdminPayments: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<any[]>(`/payments/admin/all${query ? `?${query}` : ""}`);
  },
  createAdminPayment: (payload: any) => apiFetch<any>("/payments/admin/manual-create", { method: "POST", body: JSON.stringify(payload) }),
  getConfig: () => apiFetch<any>("/payments/admin/config"),
  saveConfig: (payload: any) => apiFetch<any>("/payments/admin/config", { method: "POST", body: JSON.stringify(payload) }),
};

export const notificationsApi = {
  getNotifications: () => apiFetch<any[]>("/notifications"),
  markRead: (id: string) => apiFetch<any>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiFetch<void>("/notifications/mark-all-read", { method: "POST" }),
};

export const filesApi = {
  getPresignedUrl: (fileName: string, fileType?: string) => apiFetch<{ uploadUrl: string; fileKey: string }>("/files/presigned-url", { method: "POST", body: JSON.stringify({ fileName, fileType }) }),
};
