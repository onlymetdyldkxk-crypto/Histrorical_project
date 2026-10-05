import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useSimulatedLoad, useStore } from "../../lib/store";
import type { RequestStatus } from "../../lib/types";
import { docTypeLabel, fmtDate, statusMeta } from "../../lib/utils";
import { Badge, Button, Card, EmptyState, Icon, Input, LoadingPanel, Reveal, Select, StatCard, StatusBadge } from "../../components/ui";
import { cn } from "../../utils/cn";

/* ============================= LAYOUT ============================= */

export function AdminLayout() {
  const items = [
    { to: "/admin", icon: "gauge", label: "Overview", end: true },
    { to: "/admin/requests", icon: "folder", label: "All Requests", end: false },
    { to: "/admin/payments", icon: "ledger", label: "Payments", end: false },
  ];
  const integrations = ["Payment gateway", "Email / SMS delivery", "Secure file storage", "n8n automation workflows"];
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-faint lg:block">Admin Panel</p>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:pb-0">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-2.5 border px-3.5 py-2.5 text-[13px] font-semibold transition-colors lg:rounded-none lg:border-b-0 lg:border-l-2 lg:pl-4",
                    isActive ? "border-accent bg-accent/8 text-accent" : "border-line bg-card text-ink-soft hover:text-ink lg:bg-transparent lg:border-l-line"
                  )
                }
              >
                <Icon name={it.icon} size={16} /> {it.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 hidden border border-line bg-parchment/40 p-4 lg:block">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Future integrations</p>
            <ul className="mt-3 space-y-2.5">
              {integrations.map((i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-[12px] text-ink-soft">
                  {i}
                  <Badge tone="neutral" dot={false}>Not connected</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
              UI boundaries are ready; each item connects through the backend without redesign.
            </p>
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ============================= OVERVIEW ============================= */

export function AdminOverview() {
  const { requests } = useStore();
  const nav = useNavigate();
  const loading = useSimulatedLoad(600);
  const c = (s: RequestStatus | RequestStatus[]) => requests.filter((r) => (Array.isArray(s) ? s.includes(r.status) : r.status === s)).length;

  if (loading) return <LoadingPanel label="Loading admin overview…" icon="gauge" />;

  const cards: { label: string; value: number; icon: string; tone: any; status: RequestStatus }[] = [
    { label: "New Requests", value: c("submitted"), icon: "plus", tone: "slate", status: "submitted" },
    { label: "Pending Reviews", value: c("under_review"), icon: "eye", tone: "amber", status: "under_review" },
    { label: "Accepted Requests", value: c(["accepted", "quote_available"]), icon: "check", tone: "gold", status: "quote_available" },
    { label: "Rejected Requests", value: c("rejected"), icon: "x", tone: "red", status: "rejected" },
    { label: "Awaiting Payment", value: c("payment_pending"), icon: "ledger", tone: "clay", status: "payment_pending" },
    { label: "Paid Requests", value: c("payment_received"), icon: "lock", tone: "teal", status: "payment_received" },
    { label: "Processing", value: c("processing"), icon: "hand", tone: "indigo", status: "processing" },
    { label: "Completed", value: c("completed"), icon: "seal", tone: "moss", status: "completed" },
  ];

  const newest = [...requests].sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt)).slice(0, 6);

  return (
    <div>
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Admin · Overview</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">The desk, at a glance.</h1>
        <p className="mt-2 text-[13.5px] text-ink-soft">
          {c(["submitted", "under_review"])} request{c(["submitted", "under_review"]) !== 1 ? "s are" : " is"} waiting for your review today, {fmtDate(new Date().toISOString())}.
        </p>
      </Reveal>

      <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((s, i) => (
          <Reveal key={s.label} delay={i * 45}>
            <StatCard label={s.label} value={s.value} icon={s.icon} tone={s.tone} to={`/admin/requests?status=${s.status}`} />
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">New Requests</h2>
          <Button variant="ghost" size="sm" iconRight="arrowR" to="/admin/requests">
            View all
          </Button>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-5 py-3.5 font-semibold">Request</th>
                <th className="px-4 py-3.5 font-semibold">User</th>
                <th className="px-4 py-3.5 font-semibold">Document</th>
                <th className="px-4 py-3.5 font-semibold">Type</th>
                <th className="px-4 py-3.5 font-semibold">Submitted</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newest.map((r) => (
                <tr key={r.id} className="border-b border-line-soft text-[13px] transition-colors last:border-0 hover:bg-parchment/30">
                  <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-ink">{r.id}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{r.userName}</td>
                  <td className="max-w-[190px] truncate px-4 py-3.5 font-medium text-ink">{r.document.fileName}</td>
                  <td className="px-4 py-3.5 text-ink-faint">{docTypeLabel[r.document.fileType]}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{fmtDate(r.submittedAt)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="subtle" size="sm" icon="eye" onClick={() => nav(`/admin/requests/${r.id}`)}>View</Button>
                      {["submitted", "under_review"].includes(r.status) ? (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => nav(`/admin/requests/${r.id}?do=accept`)}>Accept</Button>
                          <Button variant="danger" size="sm" onClick={() => nav(`/admin/requests/${r.id}?do=reject`)}>Reject</Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm" iconRight="arrowR" onClick={() => nav(`/admin/requests/${r.id}?do=review`)}>Review</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Reveal>
    </div>
  );
}

/* ============================= REQUESTS LIST ============================= */

export function AdminRequests() {
  const { requests } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(params.get("status") ?? "all");
  const [dateF, setDateF] = useState("any");
  const [payF, setPayF] = useState("any");
  const [typeF, setTypeF] = useState("any");
  const [sort, setSort] = useState<"newest" | "oldest" | "updated">("newest");
  const loading = useSimulatedLoad(450);

  const filtered = useMemo(() => {
    const now = Date.now();
    let list = [...requests];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(s) ||
          r.userName.toLowerCase().includes(s) ||
          r.requirements.email.toLowerCase().includes(s) ||
          r.document.fileName.toLowerCase().includes(s)
      );
    }
    if (status !== "all") list = list.filter((r) => r.status === status);
    if (dateF !== "any") {
      list = list.filter((r) => {
        const age = (now - +new Date(r.submittedAt)) / 86400000;
        return dateF === "7" ? age <= 7 : dateF === "30" ? age <= 30 : age > 30;
      });
    }
    if (payF !== "any") list = list.filter((r) => (payF === "none" ? !r.payment || r.payment.status === "none" : r.payment?.status === payF));
    if (typeF !== "any") list = list.filter((r) => r.document.fileType === typeF || (typeF === "image" && r.document.fileType === "images"));
    list.sort((a, b) =>
      sort === "newest"
        ? +new Date(b.submittedAt) - +new Date(a.submittedAt)
        : sort === "oldest"
          ? +new Date(a.submittedAt) - +new Date(b.submittedAt)
          : +new Date(b.updatedAt) - +new Date(a.updatedAt)
    );
    return list;
  }, [requests, q, status, dateF, payF, typeF, sort]);

  if (loading) return <LoadingPanel label="Loading requests…" icon="folder" />;

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-3xl font-semibold text-ink">All Requests</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">{filtered.length} of {requests.length} requests shown.</p>
      </Reveal>

      {/* controls */}
      <Card className="mt-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="relative">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input placeholder="Search by request ID, user name, email or document…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {Object.entries(statusMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <Select value={dateF} onChange={(e) => setDateF(e.target.value)} aria-label="Filter by date">
            <option value="any">Any date</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="old">Older than 30 days</option>
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
          </Select>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <Select value={payF} onChange={(e) => setPayF(e.target.value)} aria-label="Filter by payment">
            <option value="any">Payment: any</option>
            <option value="none">No payment yet</option>
            <option value="pending">Pending</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
          </Select>
          <Select value={typeF} onChange={(e) => setTypeF(e.target.value)} aria-label="Filter by document type">
            <option value="any">Document: any type</option>
            <option value="pdf">PDF</option>
            <option value="doc">Word document</option>
            <option value="slides">Presentation</option>
            <option value="image">Image(s)</option>
            <option value="link">Drive link</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="search"
          title="No requests match these filters."
          body="Try widening the date range or clearing the search."
          action={<Button variant="secondary" size="sm" onClick={() => { setQ(""); setStatus("all"); setDateF("any"); setPayF("any"); setTypeF("any"); }}>Clear all filters</Button>}
        />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-5 py-3.5 font-semibold">Request</th>
                <th className="px-4 py-3.5 font-semibold">User</th>
                <th className="px-4 py-3.5 font-semibold">Document</th>
                <th className="px-4 py-3.5 font-semibold">Type</th>
                <th className="px-4 py-3.5 font-semibold">Submitted</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Payment</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => nav(`/admin/requests/${r.id}`)} className="cursor-pointer border-b border-line-soft text-[13px] transition-colors last:border-0 hover:bg-parchment/30">
                  <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-ink">{r.id}</td>
                  <td className="px-4 py-3.5 text-ink-soft">
                    <p className="font-medium text-ink">{r.userName}</p>
                    <p className="text-[11px] text-ink-faint">{r.requirements.email}</p>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3.5 font-medium text-ink">{r.document.fileName}</td>
                  <td className="px-4 py-3.5 text-ink-faint">{docTypeLabel[r.document.fileType]}</td>
                  <td className="px-4 py-3.5 text-ink-soft">{fmtDate(r.submittedAt)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3.5 text-[12px] text-ink-soft">{r.payment ? r.payment.status : "—"}</td>
                  <td className="px-4 py-3.5 text-right text-ink-faint"><Icon name="arrowR" size={15} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
