import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { paymentsApi } from "../../lib/api";
import { useStore } from "../../lib/store";
import { fmtDateTime, fmtMoney } from "../../lib/utils";
import { Badge, Button, Card, EmptyState, Icon, Input, LoadingPanel, Reveal, Select } from "../../components/ui";

export function AdminPayments() {
  const { requests } = useStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getAdminPayments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: q.trim() ? q.trim() : undefined,
      });
      setPayments(data || []);
    } catch (err: any) {
      // Fallback to local store data if backend API is offline
      const storePayments = requests
        .filter((r) => r.payment && r.payment.status !== "none")
        .map((r) => ({
          id: r.payment?.id || `PAY-${r.id}`,
          requestId: r.id,
          gatewayOrderId: r.payment?.gatewayOrderId || `ORD-${r.id}`,
          razorpayPaymentId: r.payment?.transactionId || "pay_rzp_live",
          transactionId: r.payment?.transactionId,
          amount: r.payment?.amount || r.quote?.charge || 0,
          currency: "INR",
          status: (r.payment?.status || "PENDING").toUpperCase(),
          paymentMethod: "Razorpay Online",
          paidAt: r.payment?.paidAt || r.updatedAt,
          request: r,
        }));
      setPayments(storePayments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const filteredPayments = useMemo(() => {
    let list = [...payments];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.id?.toLowerCase().includes(s) ||
          p.requestId?.toLowerCase().includes(s) ||
          p.gatewayOrderId?.toLowerCase().includes(s) ||
          p.razorpayPaymentId?.toLowerCase().includes(s) ||
          p.transactionId?.toLowerCase().includes(s) ||
          p.request?.user?.name?.toLowerCase().includes(s) ||
          p.request?.user?.email?.toLowerCase().includes(s) ||
          p.request?.requirements?.fullName?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [payments, q]);

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Admin · Financials</p>
            <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Payment Records</h1>
            <p className="mt-1.5 text-[13.5px] text-ink-soft">
              Real-time Razorpay gateway transactions linked directly to customer requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-moss/40 bg-moss/10 px-3.5 py-1.5 text-[12px] font-medium text-moss">
              <span className="h-2 w-2 rounded-full bg-moss animate-pulse" />
              Razorpay Linked (Key: rzp_test_Tflw...)
            </span>
          </div>
        </div>
      </Reveal>

      {/* Filters and search */}
      <Card className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <div className="relative">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Search by Payment ID, Order ID, Transaction ID or Customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status">
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Button variant="secondary" icon="refresh" onClick={fetchPayments}>
            Refresh
          </Button>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading payment logs…" icon="ledger" className="mt-6" />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="ledger"
          title="No payment records found"
          body="No payments match your current search criteria or status filter."
          action={
            <Button variant="secondary" size="sm" onClick={() => { setQ(""); setStatusFilter("all"); }}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                <th className="px-5 py-3.5 font-semibold">Payment ID</th>
                <th className="px-4 py-3.5 font-semibold">Request</th>
                <th className="px-4 py-3.5 font-semibold">Customer (User)</th>
                <th className="px-4 py-3.5 font-semibold">Amount</th>
                <th className="px-4 py-3.5 font-semibold">Method</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Date / Time</th>
                <th className="px-5 py-3.5 text-right font-semibold">Razorpay Order ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const statusTone =
                  p.status === "SUCCESSFUL" || p.status === "successful"
                    ? "moss"
                    : p.status === "FAILED" || p.status === "failed"
                    ? "red"
                    : "amber";

                const custName =
                  p.request?.user?.name ||
                  p.request?.requirements?.fullName ||
                  p.request?.userName ||
                  "Customer";
                const custEmail = p.request?.user?.email || p.request?.requirements?.email || "";

                return (
                  <tr key={p.id} className="border-b border-line-soft text-[13px] transition-colors last:border-0 hover:bg-parchment/30">
                    <td className="px-5 py-3.5 font-mono text-[12px] font-semibold text-accent">
                      {p.transactionId || p.razorpayPaymentId || p.id.slice(0, 14)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link to={`/admin/requests/${p.requestId}`} className="font-mono text-[12px] font-semibold text-accent hover:underline">
                        {p.requestId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link to={`/admin/requests/${p.requestId}`} className="group block">
                        <p className="font-medium text-ink group-hover:text-accent">{custName}</p>
                        {custEmail && <p className="text-[11px] text-ink-faint">{custEmail}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-display text-[15px] font-semibold text-ink">
                      {fmtMoney(p.amount || 0)} <span className="text-[11px] font-normal text-ink-faint">{p.currency || "INR"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-ink-soft">
                      {p.paymentMethod || "Razorpay Online"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={statusTone}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">
                      {p.paidAt ? fmtDateTime(p.paidAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11.5px] text-ink-faint">
                      {p.gatewayOrderId || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
