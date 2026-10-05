import { Link } from "react-router-dom";
import { useSimulatedLoad, useStore } from "../lib/store";
import { fmtDate, fmtMoney } from "../lib/utils";
import { Button, Card, EmptyState, Icon, LoadingPanel, Reveal, StatCard, StatusBadge } from "../components/ui";

export default function Dashboard() {
  const { user, myRequests } = useStore();
  const loading = useSimulatedLoad(650);

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter((r) => ["draft", "submitted", "under_review"].includes(r.status)).length,
    accepted: myRequests.filter((r) => ["accepted", "quote_available", "payment_pending", "payment_received", "processing"].includes(r.status)).length,
    completed: myRequests.filter((r) => r.status === "completed").length,
  };

  const sorted = [...myRequests].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const firstName = user?.name.split(" ")[0] ?? "there";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-10">
        <LoadingPanel label="Loading your requests…" icon="folder" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      {/* Greeting */}
      <Reveal className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Your dashboard</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Welcome back, <span className="italic text-accent">{firstName}</span>.
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-ink-soft">
            Track your document requests, view quotes and download completed work — all in one place.
          </p>
        </div>
        <Button size="lg" icon="plus" to="/submit" className="self-start sm:self-auto">
          Submit New Document
        </Button>
      </Reveal>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Requests", value: stats.total, icon: "folder", tone: "neutral" as const, hint: "Everything you have ever submitted" },
          { label: "Pending Requests", value: stats.pending, icon: "clock", tone: "amber" as const, hint: "Awaiting review by our team" },
          { label: "Accepted Requests", value: stats.accepted, icon: "check", tone: "gold" as const, hint: "Quoted, paid or in progress" },
          { label: "Completed Requests", value: stats.completed, icon: "seal", tone: "moss" as const, hint: "Ready to download" },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 70}>
            <StatCard {...s} />
          </Reveal>
        ))}
      </div>

      {/* Requests */}
      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Your Requests</h2>
          {sorted.length > 0 && <span className="text-[12px] text-ink-faint">{sorted.length} total · sorted by recent activity</span>}
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon="quill"
            title="You haven't submitted any document requests yet."
            body="Start with a single document — a letter, a deed, a set of photographs of an old page. Our team will do the reading."
            action={<Button icon="plus" to="/submit">Submit Your First Document</Button>}
          />
        ) : (
          <div className="space-y-4">
            {sorted.map((r, i) => (
              <Reveal key={r.id} delay={i * 50}>
                <Link to={`/requests/${r.id}`} className="group block">
                  <Card ticks className="p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lift sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex flex-1 items-start gap-4">
                        <span className="corner-ticks grid h-11 w-11 shrink-0 place-items-center border border-line bg-parchment/50 text-accent">
                          <Icon name={r.document.kind === "drive" ? "link" : r.document.fileType === "images" ? "image" : "doc"} size={20} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-mono text-[11.5px] font-semibold tracking-wide text-ink-faint">{r.id}</span>
                            <StatusBadge status={r.status} />
                          </div>
                          <p className="mt-1 truncate font-display text-[19px] font-semibold text-ink group-hover:text-accent">{r.document.fileName}</p>
                          <p className="mt-1 text-[12px] text-ink-faint">
                            Submitted {fmtDate(r.submittedAt)} · {r.document.kind === "drive" ? "Google Drive link" : `${r.document.fileCount ?? 1} file${(r.document.fileCount ?? 1) > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-right">
                          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Est. cost</p>
                          <p className="mt-0.5 font-display text-lg font-semibold text-ink">{r.quote ? fmtMoney(r.quote.charge) : "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Est. time</p>
                          <p className="mt-0.5 font-display text-lg font-semibold text-ink">{r.quote ? `${r.quote.estimatedDays} days` : "—"}</p>
                        </div>
                        <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-line text-ink-faint transition-all group-hover:border-accent group-hover:text-accent sm:flex">
                          <Icon name="arrowR" size={16} />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
