import { Link, useParams } from "react-router-dom";
import { useSimulatedLoad, useStore } from "../lib/store";
import { buildTimeline, docTypeLabel, downloadMockFile, fmtBytes, fmtDate, fmtDateTime, fmtMoney, statusMeta } from "../lib/utils";
import { Badge, Button, Card, EmptyState, Icon, KV, LoadingPanel, PayBadge, Reveal, StatusBadge, Timeline } from "../components/ui";

export default function RequestDetails() {
  const { id } = useParams();
  const { requests, beginPayment, toast, user } = useStore();
  const loading = useSimulatedLoad(450);
  const req = requests.find((r) => r.id === id);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-10">
        <LoadingPanel label="Loading request…" icon="folder" />
      </div>
    );
  }

  if (!req || (user && user.role === "user" && req.userId !== user.id)) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16">
        <EmptyState
          icon="search"
          title="Request not found"
          body="We couldn't find this request. It may have been removed, or the link is incorrect."
          action={<Button to="/dashboard" variant="secondary" icon="arrowL">Back to My Requests</Button>}
        />
      </div>
    );
  }

  const meta = statusMeta[req.status];
  const awaitingPayment = req.status === "quote_available" || req.status === "payment_pending";
  const isAdmin = user?.role === "admin";

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8">
      {/* Header */}
      <Reveal>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft transition-colors hover:text-accent">
          <Icon name="arrowL" size={14} /> All requests
        </Link>
        <div className="mt-4 flex flex-col justify-between gap-5 border-b border-line pb-7 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[12px] font-semibold tracking-wider text-ink-faint">{req.id}</span>
              <StatusBadge status={req.status} />
              {req.payment && <PayBadge status={req.payment.status} />}
            </div>
            <h1 className="mt-2.5 truncate font-display text-3xl font-semibold text-ink sm:text-4xl">{req.document.fileName}</h1>
            <p className="mt-2 text-[13px] text-ink-soft">
              Submitted {fmtDate(req.submittedAt)} · {isAdmin ? `by ${req.userName}` : "by you"} · {docTypeLabel[req.document.fileType]}
            </p>
            <p className="mt-1 text-[12.5px] italic text-ink-faint">{meta.hint}</p>
          </div>
          {awaitingPayment && (
            <Button
              size="lg"
              icon="ledger"
              onClick={() => {
                beginPayment(req.id);
                toast("Opening payment.", "info", "Payment remains pending until you complete it.");
                (window.location.hash = `#/requests/${req.id}/payment`);
              }}
            >
              Proceed to Payment
            </Button>
          )}
          {req.status === "completed" && (
            <Button size="lg" icon="download" to={`/requests/${req.id}/completed`}>
              Download Completed File
            </Button>
          )}
        </div>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_330px]">
        {/* ============ LEFT ============ */}
        <div className="space-y-6">
          {/* completion banner */}
          {req.status === "completed" && req.completion && (
            <Reveal>
              <Card ticks className="border-moss/40 bg-moss/6 p-6">
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <span className="corner-ticks grid h-14 w-14 shrink-0 place-items-center border border-moss/40 bg-card text-moss">
                    <Icon name="seal" size={28} />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl font-semibold text-ink">Your Document Is Ready</h2>
                    <p className="mt-1 text-[13.5px] text-ink-soft">
                      Completed {fmtDate(req.completion.completedAt)} · {req.completion.fileName}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button icon="download" onClick={() => downloadMockFile(req, "completed")}>Download</Button>
                    <Button variant="secondary" to={`/requests/${req.id}/completed`}>Details</Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          {/* rejection card */}
          {req.status === "rejected" && req.rejection && (
            <Reveal>
              <Card ticks className="border-accent/30 bg-accent/[0.04] p-6">
                <div className="flex items-start gap-4">
                  <span className="corner-ticks grid h-12 w-12 shrink-0 place-items-center border border-accent/30 bg-card text-accent">
                    <Icon name="x" size={20} />
                  </span>
                  <div>
                    <h2 className="font-display text-[22px] font-semibold text-ink">Unfortunately, this request could not be accepted.</h2>
                    <p className="mt-2 border-l-2 border-accent/40 pl-3 text-[13px] font-semibold text-accent-deep">{req.rejection.reason}</p>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">{req.rejection.message}</p>
                    <p className="mt-2 text-[11.5px] text-ink-faint">Reviewed on {fmtDate(req.rejection.at)}</p>
                    <div className="mt-5">
                      <Button variant="secondary" icon="plus" to="/submit">Submit a New Document</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          {/* quotation card */}
          {req.quote && !req.status.startsWith("rejected") && (
            <Reveal>
              <Card ticks className="relative overflow-hidden p-6">
                <span className="pointer-events-none absolute -right-6 -top-6 grid h-28 w-28 place-items-center rounded-full border border-gold/20 text-gold/20">
                  <Icon name="seal" size={70} strokeWidth={1} />
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
                    <Icon name="ledger" size={20} className="text-gold" /> Quotation
                  </h2>
                  <PayBadge status={req.payment?.status ?? "none"} />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="border border-line bg-cream p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Processing Charges</p>
                    <p className="mt-1.5 font-display text-3xl font-semibold text-accent">{fmtMoney(req.quote.charge)}</p>
                  </div>
                  <div className="border border-line bg-cream p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Estimated Completion</p>
                    <p className="mt-1.5 font-display text-3xl font-semibold text-ink">{req.quote.estimatedDays} <span className="text-lg text-ink-soft">days</span></p>
                  </div>
                  <div className="border border-line bg-cream p-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">Expected by</p>
                    <p className="mt-1.5 font-display text-xl font-semibold text-ink">{fmtDate(req.quote.expectedDate)}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-line-soft pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Message from our team</p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{req.quote.adminMessage}</p>
                  {req.quote.extraInstructions && (
                    <>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Additional instructions</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{req.quote.extraInstructions}</p>
                    </>
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {awaitingPayment && (
                    <Button
                      icon="ledger"
                      onClick={() => {
                        beginPayment(req.id);
                        (window.location.hash = `#/requests/${req.id}/payment`);
                      }}
                    >
                      Proceed to Payment
                    </Button>
                  )}
                  {req.payment?.status === "successful" && (
                    <Badge tone="moss">Paid {fmtDate(req.payment.paidAt)} · {req.payment.transactionId}</Badge>
                  )}
                </div>
              </Card>
            </Reveal>
          )}

          {/* document card */}
          <Reveal>
            <Card ticks className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                  <Icon name="doc" size={18} className="text-gold" /> Your Document
                </h2>
                <Badge tone="neutral">Received as submitted</Badge>
              </div>
              <div className="mt-4 grid gap-5 sm:grid-cols-[150px_1fr]">
                <div className="corner-ticks grid h-36 place-items-center border border-line bg-parchment/50">
                  <div className="text-center">
                    <Icon name={req.document.kind === "drive" ? "link" : req.document.fileType === "images" || req.document.fileType === "image" ? "image" : "doc"} size={38} className="mx-auto text-accent/70" />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                      {req.document.kind === "drive" ? "Drive" : (req.document.fileName.split(".").pop() || "file")}
                    </p>
                  </div>
                </div>
                <dl>
                  <KV k="File name" v={<span className="break-all">{req.document.fileName}</span>} />
                  <KV k="Type" v={docTypeLabel[req.document.fileType]} />
                  <KV k="Size" v={req.document.kind === "drive" ? "n/a (link)" : fmtBytes(req.document.fileSize)} />
                  <KV k="Files" v={req.document.fileCount ?? 1} />
                  <KV k="Uploaded" v={fmtDateTime(req.submittedAt)} />
                </dl>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 border-t border-line-soft pt-4">
                {req.document.kind === "drive" ? (
                  <a
                    href={req.document.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-ink/25 px-5 py-2.5 text-sm font-medium transition-all hover:border-accent/60 hover:text-accent"
                  >
                    <Icon name="external" size={15} /> Open Drive Link
                  </a>
                ) : (
                  <Button variant="secondary" icon="download" onClick={() => { downloadMockFile(req, "original"); toast("Original file (demo placeholder) downloaded.", "info"); }}>
                    Download Original
                  </Button>
                )}
                <p className="flex items-center gap-2 text-[12px] text-ink-faint">
                  <Icon name="hand" size={14} className="text-gold" /> Reviewed manually by our team — nothing is auto-converted.
                </p>
              </div>
            </Card>
          </Reveal>

          {/* requirements */}
          <Reveal>
            <Card ticks className="p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                <Icon name="quill" size={18} className="text-gold" /> Your Requirements
              </h2>
              <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                <dl>
                  <KV k="Name" v={req.requirements.fullName} />
                  <KV k="Age" v={req.requirements.age || "—"} />
                  <KV k="Gender" v={req.requirements.gender || "—"} />
                  <KV k="Email" v={req.requirements.email} />
                  <KV k="Phone" v={req.requirements.phone || "—"} />
                  <KV k="Address" v={req.requirements.address || "—"} />
                </dl>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Purpose</p>
                  <p className="mb-3 mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{req.requirements.purpose}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Requested processing</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{req.requirements.processing}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Preferred output</p>
                  <p className="mt-1.5 text-[13.5px] font-medium text-ink">{req.requirements.outputFormat}</p>
                </div>
              </div>
              {(req.requirements.instructions || req.requirements.notes) && (
                <div className="mt-4 border-t border-line-soft pt-4">
                  {req.requirements.instructions && (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Additional instructions</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{req.requirements.instructions}</p>
                    </>
                  )}
                  {req.requirements.notes && (
                    <>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Notes</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{req.requirements.notes}</p>
                    </>
                  )}
                </div>
              )}
            </Card>
          </Reveal>

          {/* admin response / processing notes */}
          {(req.adminNote || req.status === "processing") && (
            <Reveal>
              <Card ticks className="p-6">
                <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                  <Icon name="hand" size={18} className="text-gold" /> From Our Processing Team
                </h2>
                {req.status === "processing" && (
                  <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#4a4d7a]" /> Currently being processed by hand.
                  </p>
                )}
                {req.adminNote && <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{req.adminNote}</p>}
              </Card>
            </Reveal>
          )}
        </div>

        {/* ============ RIGHT ============ */}
        <div className="space-y-6">
          <Reveal delay={80}>
            <Card ticks className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Request Timeline</h3>
              <div className="mt-5">
                <Timeline stages={buildTimeline(req)} />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={140}>
            <Card className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">At a Glance</h3>
              <dl className="mt-3">
                <KV k="Request ID" v={<span className="font-mono">{req.id}</span>} mono />
                <KV k="Status" v={<StatusBadge status={req.status} />} />
                {req.quote && <KV k="Charge" v={fmtMoney(req.quote.charge)} />}
                {req.quote && <KV k="Est. completion" v={`${req.quote.estimatedDays} days`} />}
                <KV k="Payment" v={<PayBadge status={req.payment?.status ?? "none"} />} />
              </dl>
              <div className="mt-4 space-y-2.5 border-t border-line-soft pt-4">
                {awaitingPayment && (
                  <Button
                    className="w-full"
                    icon="ledger"
                    onClick={() => {
                      beginPayment(req.id);
                      (window.location.hash = `#/requests/${req.id}/payment`);
                    }}
                  >
                    Proceed to Payment
                  </Button>
                )}
                {req.status === "completed" && (
                  <Button className="w-full" variant="secondary" to={`/requests/${req.id}/completed`} icon="seal">
                    Completion Page
                  </Button>
                )}
                <Button className="w-full" variant="ghost" to="/notifications" icon="bell">
                  View Notifications
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
