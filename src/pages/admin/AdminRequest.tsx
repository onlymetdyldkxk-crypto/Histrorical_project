import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../../lib/store";
import { buildTimeline, docTypeLabel, downloadMockFile, fmtBytes, fmtDate, fmtDateTime, fmtMoney } from "../../lib/utils";
import { Button, Card, ConfirmDialog, EmptyState, Field, Icon, Input, KV, Modal, PayBadge, Reveal, StatusBadge, Textarea, Timeline } from "../../components/ui";

export default function AdminRequest() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { requests, setAdminNote, sendQuote, rejectRequest, startProcessing, completeRequest, toast } = useStore();
  const req = requests.find((r) => r.id === id);

  /* decision state */
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [quote, setQuote] = useState({ charge: "", days: "", date: "", message: "", extra: "" });
  const [note, setNote] = useState<string | null>(null);
  const [compFile, setCompFile] = useState<{ name: string; size: number } | null>(null);
  const [compNote, setCompNote] = useState("");
  const [compMsg, setCompMsg] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);

  const doParam = params.get("do");
  useEffect(() => {
    if (!req) return;
    if (doParam === "reject" && ["submitted", "under_review"].includes(req.status)) setRejectOpen(true);
    if (doParam === "accept" && ["submitted", "under_review"].includes(req.status)) setAcceptOpen(true);
    if (doParam === "review" || doParam === "accept" || doParam === "reject")
      window.setTimeout(() => decisionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doParam, req?.status]);

  if (!req) {
    return (
      <div className="pt-8">
        <EmptyState icon="search" title="Request not found" body="This request does not exist in the current demo data." action={<Button variant="secondary" to="/admin/requests" icon="arrowL">Back to Requests</Button>} />
      </div>
    );
  }

  const inReview = ["submitted", "under_review"].includes(req.status);
  const noteValue = note ?? req.adminNote ?? "";

  const submitQuote = () => {
    const charge = +quote.charge;
    const days = +quote.days;
    if (!charge || charge <= 0) return toast("Enter a valid processing charge.", "warning");
    if (!days || days <= 0) return toast("Enter a valid estimated time in days.", "warning");
    if (!quote.date) return toast("Choose an expected completion date.", "warning");
    sendQuote(req.id, {
      charge,
      estimatedDays: days,
      expectedDate: new Date(quote.date).toISOString(),
      adminMessage: quote.message || "We have reviewed your document and are ready to proceed.",
      extraInstructions: quote.extra,
    });
    setAcceptOpen(false);
    toast(`Quote sent to ${req.userName}.`, "success", `Request ${req.id} — ${fmtMoney(charge)}, ~${days} days.`);
  };

  const confirmReject = () => {
    if (rejectReason.trim().length < 5) return toast("Please give a short reason for the rejection.", "warning");
    rejectRequest(req.id, rejectReason.trim(), rejectMsg.trim() || "Unfortunately, this request could not be accepted. You are welcome to reach out with more detail or better material.");
    setRejectOpen(false);
    setRejectReason("");
    setRejectMsg("");
    toast(`Request ${req.id} rejected.`, "info", "The user has been notified.");
  };

  const submitComplete = () => {
    if (!compFile) return toast("Please select the completed file first.", "warning");
    completeRequest(req.id, {
      fileName: compFile.name,
      fileLabel: `Processed document (${fmtBytes(compFile.size)})`,
      note: compNote.trim() || "Work completed as requested.",
      message: compMsg.trim() || "Thank you for trusting us with your document.",
    });
    setCompleteOpen(false);
    toast(`Request ${req.id} marked as completed.`, "success", "The user has been notified that their document is ready.");
  };

  return (
    <div className="pt-2">
      <Link to="/admin/requests" className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft transition-colors hover:text-accent">
        <Icon name="arrowL" size={14} /> All requests
      </Link>
      <Reveal className="mt-4 flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[12px] font-semibold tracking-wider text-ink-faint">{req.id}</span>
            <StatusBadge status={req.status} />
            {req.payment && <PayBadge status={req.payment.status} />}
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{req.document.fileName}</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {req.userName} · submitted {fmtDate(req.submittedAt)} · {docTypeLabel[req.document.fileType]}
          </p>
        </div>
        <p className="max-w-[260px] text-[11.5px] leading-relaxed text-ink-faint sm:text-right">
          <Icon name="hand" size={12} className="mr-1 inline text-gold" />
          Analysis and processing on this screen are performed manually by the admin team.
        </p>
      </Reveal>

      <div className="mt-7 grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* ---------- DECISION (review stage) ---------- */}
          {inReview && (
            <Reveal>
              <div ref={decisionRef}>
                <Card ticks className="p-6">
                  <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
                    <Icon name="eye" size={20} className="text-gold" /> Review & Decision
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                    You have examined the document and requirements. Decide whether to accept the request (and quote it) or to
                    decline it with a clear reason.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button icon="check" onClick={() => setAcceptOpen(true)}>Accept Request</Button>
                    <Button variant="danger" icon="x" onClick={() => setRejectOpen(true)}>Reject Request</Button>
                  </div>
                </Card>
              </div>
            </Reveal>
          )}

          {/* ---------- PAYMENT STATUS ---------- */}
          {["quote_available", "payment_pending", "payment_received", "processing", "completed"].includes(req.status) && (
            <Reveal>
              <Card ticks className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                    <Icon name="ledger" size={18} className="text-gold" /> Payment Status
                  </h2>
                  <PayBadge status={req.payment?.status ?? "none"} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { l: "Payment Pending", on: req.payment?.status === "pending" },
                    { l: "Payment Successful", on: req.payment?.status === "successful" },
                    { l: "Payment Failed", on: req.payment?.status === "failed" },
                    { l: "Verification Pending", on: req.payment?.status === "verifying" },
                  ].map((s) => (
                    <div key={s.l} className={`flex items-center gap-2.5 border p-3 text-[12.5px] font-medium ${s.on ? "border-gold/50 bg-gold/10 text-ink" : "border-line-soft text-ink-faint"}`}>
                      <span className={`h-2 w-2 rounded-full ${s.on ? "bg-gold" : "bg-line"}`} /> {s.l}
                      {s.on && <Icon name="check" size={13} className="ml-auto text-gold" />}
                    </div>
                  ))}
                </div>
                <dl className="mt-4">
                  {req.quote && <KV k="Quoted amount" v={fmtMoney(req.quote.charge)} />}
                  {req.payment?.transactionId && <KV k="Transaction ID" v={<span className="font-mono">{req.payment.transactionId}</span>} mono />}
                  {req.payment?.paidAt && <KV k="Paid at" v={fmtDateTime(req.payment.paidAt)} />}
                </dl>
                <p className="mt-4 flex items-start gap-2.5 border-t border-line-soft pt-4 text-[12px] leading-relaxed text-ink-faint">
                  <Icon name="bell" size={14} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    <span className="font-semibold text-ink-soft">“Payment received for Request #{req.id.replace("REQ-", "")}.”</span>{" "}
                    — placeholder admin alert. Live confirmations will arrive through the payment gateway & n8n workflows once connected.
                  </span>
                </p>
              </Card>
            </Reveal>
          )}

          {/* ---------- AFTER PAYMENT: START PROCESSING ---------- */}
          {req.status === "payment_received" && (
            <Reveal>
              <Card ticks className="border-moss/40 bg-moss/6 p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink">Ready to start work</h2>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      Payment of {fmtMoney(req.quote?.charge ?? 0)} is confirmed. Begin the manual processing of this document.
                    </p>
                  </div>
                  <Button size="lg" icon="hand" onClick={() => setStartOpen(true)}>Start Processing</Button>
                </div>
              </Card>
            </Reveal>
          )}

          {/* ---------- PROCESSING: UPLOAD COMPLETED FILE ---------- */}
          {req.status === "processing" && (
            <Reveal>
              <Card ticks className="p-6">
                <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
                  <Icon name="hand" size={20} className="text-gold" /> Upload Completed Document
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  When the manual work is finished, upload the final processed file and add your notes. The user is notified and
                  can download it immediately.
                </p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="mb-1.5 text-[13px] font-semibold text-ink">Completed File <span className="text-accent">*</span></p>
                    {compFile ? (
                      <div className="flex items-center gap-3 border border-moss/40 bg-moss/8 p-3.5">
                        <Icon name="doc" size={18} className="text-moss" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{compFile.name}</p>
                          <p className="text-[11.5px] text-ink-faint">{fmtBytes(compFile.size)} · selected</p>
                        </div>
                        <button onClick={() => setCompFile(null)} className="grid h-8 w-8 place-items-center border border-line text-ink-faint hover:border-accent/50 hover:text-accent" title="Remove">
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full flex-col items-center gap-2 border-2 border-dashed border-line bg-card px-4 py-8 text-ink-soft transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        <Icon name="upload" size={22} className="text-gold" />
                        <span className="text-[13px] font-semibold">Choose the completed file…</span>
                        <span className="text-[11.5px] text-ink-faint">PDF, Word or images — the final processed document</span>
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setCompFile({ name: f.name, size: f.size });
                      }}
                    />
                  </div>
                  <Field label="Admin Note" hint="A short working note describing what was done.">
                    <Textarea value={compNote} onChange={(e) => setCompNote(e.target.value)} placeholder="e.g. All six articles transcribed; two illegible words marked [illegible]…" />
                  </Field>
                  <Field label="Completion Message" hint="Shown to the user alongside the finished document.">
                    <Textarea value={compMsg} onChange={(e) => setCompMsg(e.target.value)} className="min-h-[80px]" placeholder="Thank you for entrusting us with your document…" />
                  </Field>
                  <div className="flex justify-end border-t border-line-soft pt-5">
                    <Button size="lg" icon="seal" onClick={() => setCompleteOpen(true)}>Mark as Completed</Button>
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          {/* ---------- COMPLETED SUMMARY ---------- */}
          {req.status === "completed" && req.completion && (
            <Reveal>
              <Card ticks className="border-moss/40 bg-moss/6 p-6">
                <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
                  <Icon name="seal" size={20} className="text-moss" /> Completed
                </h2>
                <dl className="mt-4">
                  <KV k="Completed file" v={req.completion.fileName} />
                  <KV k="Completed on" v={fmtDateTime(req.completion.completedAt)} />
                  <KV k="Status" v={<StatusBadge status={req.status} />} />
                </dl>
                <p className="mt-3 border-l-2 border-moss/40 pl-3 text-[13px] leading-relaxed text-ink-soft">{req.completion.note}</p>
              </Card>
            </Reveal>
          )}

          {/* ---------- REJECTED SUMMARY ---------- */}
          {req.status === "rejected" && req.rejection && (
            <Reveal>
              <Card ticks className="border-accent/30 bg-accent/[0.04] p-6">
                <h2 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-ink">
                  <Icon name="x" size={20} className="text-accent" /> Rejected
                </h2>
                <p className="mt-3 border-l-2 border-accent/40 pl-3 text-[13px] font-semibold text-accent-deep">{req.rejection.reason}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{req.rejection.message}</p>
                <p className="mt-2 text-[11.5px] text-ink-faint">Sent on {fmtDate(req.rejection.at)}</p>
              </Card>
            </Reveal>
          )}

          {/* ---------- DOCUMENT ---------- */}
          <Reveal>
            <Card ticks className="p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                <Icon name="doc" size={18} className="text-gold" /> Document
              </h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-[150px_1fr]">
                <div className="corner-ticks grid h-36 place-items-center border border-line bg-parchment/50">
                  <div className="text-center">
                    <Icon name={req.document.kind === "drive" ? "link" : req.document.fileType === "images" || req.document.fileType === "image" ? "image" : "doc"} size={38} className="mx-auto text-accent/70" />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">{req.document.kind === "drive" ? "Drive" : (req.document.fileName.split(".").pop() || "file")}</p>
                  </div>
                </div>
                <div>
                  <dl>
                    <KV k="File name" v={<span className="break-all">{req.document.fileName}</span>} />
                    <KV k="Type" v={docTypeLabel[req.document.fileType]} />
                    <KV k="Size" v={req.document.kind === "drive" ? "n/a (link)" : fmtBytes(req.document.fileSize)} />
                    <KV k="Uploaded" v={fmtDateTime(req.submittedAt)} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {req.document.kind === "drive" ? (
                      <a href={req.document.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-ink/25 px-4 py-2 text-[12.5px] font-medium transition-colors hover:border-accent/60 hover:text-accent">
                        <Icon name="external" size={14} /> Open Drive Link
                      </a>
                    ) : (
                      <Button variant="secondary" size="sm" icon="download" onClick={() => { downloadMockFile(req, "original"); toast("Original file (demo placeholder) downloaded.", "info"); }}>
                        Download original
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* ---------- USER DETAILS ---------- */}
          <Reveal>
            <Card ticks className="p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                <Icon name="user" size={18} className="text-gold" /> User Details
              </h2>
              <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
                <dl>
                  <KV k="Name" v={req.requirements.fullName} />
                  <KV k="Age" v={req.requirements.age || "—"} />
                  <KV k="Gender" v={req.requirements.gender || "—"} />
                </dl>
                <dl>
                  <KV k="Email" v={req.requirements.email} />
                  <KV k="Phone" v={req.requirements.phone || "—"} />
                  <KV k="Address" v={req.requirements.address || "—"} />
                </dl>
              </div>
            </Card>
          </Reveal>

          {/* ---------- REQUIREMENTS ---------- */}
          <Reveal>
            <Card ticks className="p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                <Icon name="quill" size={18} className="text-gold" /> User Requirements
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Purpose</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{req.requirements.purpose}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Requested processing</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">{req.requirements.processing}</p>
                </div>
                <KV k="Preferred output" v={req.requirements.outputFormat} />
                {req.requirements.instructions && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Additional instructions</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{req.requirements.instructions}</p>
                  </div>
                )}
                {req.requirements.notes && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Notes</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">{req.requirements.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>

          {/* ---------- MANUAL ANALYSIS ---------- */}
          <Reveal>
            <Card ticks className="p-6">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                <Icon name="hand" size={18} className="text-gold" /> Manual Analysis & Working Notes
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                Record what you find while reading the document — condition, legibility, scope. These notes are shared with the
                user once processing is underway.
              </p>
              <div className="mt-4">
                <Textarea value={noteValue} onChange={(e) => setNote(e.target.value)} className="min-h-[110px]" placeholder="e.g. Pages 1–9 clean; page 10 water-damaged in the lower right — names still readable…" />
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="check"
                  onClick={() => {
                    setAdminNote(req.id, noteValue);
                    toast("Working notes saved.", "success");
                  }}
                >
                  Save Notes
                </Button>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="space-y-6">
          <Reveal delay={80}>
            <Card ticks className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Timeline</h3>
              <div className="mt-5">
                <Timeline stages={buildTimeline(req)} compact />
              </div>
            </Card>
          </Reveal>
          <Reveal delay={140}>
            <Card className="p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">At a Glance</h3>
              <dl className="mt-3">
                <KV k="Request ID" v={<span className="font-mono">{req.id}</span>} mono />
                <KV k="Status" v={<StatusBadge status={req.status} />} />
                <KV k="User" v={req.userName} />
                {req.quote && <KV k="Charge" v={fmtMoney(req.quote.charge)} />}
                {req.quote && <KV k="Est. time" v={`${req.quote.estimatedDays} days`} />}
                <KV k="Payment" v={<PayBadge status={req.payment?.status ?? "none"} />} />
              </dl>
              <div className="mt-4 space-y-2.5 border-t border-line-soft pt-4">
                <Button className="w-full" variant="ghost" size="sm" to="/notifications" icon="bell">Admin Notifications</Button>
                <Button className="w-full" variant="ghost" size="sm" to="/admin/requests" icon="arrowL">Back to List</Button>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* ---------- QUOTE MODAL ---------- */}
      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Accept & Send Quotation" wide>
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Accepting request <span className="font-mono font-semibold text-ink">{req.id}</span> sends a written quotation to{" "}
          <span className="font-semibold text-ink">{req.requirements.fullName}</span>. Processing begins only after payment.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Processing Charge" required hint={`in ${fmtMoney(0).replace(/0+$/, "") || "₹"}`}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">₹</span>
              <Input type="number" min={0} value={quote.charge} onChange={(e) => setQuote({ ...quote, charge: e.target.value })} className="pl-8" placeholder="e.g. 1500" />
            </div>
          </Field>
          <Field label="Estimated Time" required>
            <div className="relative">
              <Input type="number" min={1} value={quote.days} onChange={(e) => setQuote({ ...quote, days: e.target.value })} className="pr-12" placeholder="e.g. 5" />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-ink-faint">days</span>
            </div>
          </Field>
          <Field label="Expected Completion" required>
            <Input type="date" value={quote.date} onChange={(e) => setQuote({ ...quote, date: e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Admin Message" hint="Explains the scope of the quote in your own words.">
            <Textarea value={quote.message} onChange={(e) => setQuote({ ...quote, message: e.target.value })} className="min-h-[90px]" placeholder="We have examined the document. The quote covers…" />
          </Field>
          <Field label="Additional Instructions" optional>
            <Textarea value={quote.extra} onChange={(e) => setQuote({ ...quote, extra: e.target.value })} className="min-h-[70px]" placeholder="Anything the user should know about the approach…" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="subtle" onClick={() => setAcceptOpen(false)}>Cancel</Button>
          <Button icon="send" onClick={submitQuote}>Send Quote to User</Button>
        </div>
      </Modal>

      {/* ---------- REJECT MODAL ---------- */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Request">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          The user will be told plainly why this request could not be accepted. Be specific — it helps them come back better prepared.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Rejection Reason" required hint="One line, shown as the summary.">
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Document unreadable in the submitted scan" />
          </Field>
          <Field label="Message to User" optional>
            <Textarea value={rejectMsg} onChange={(e) => setRejectMsg(e.target.value)} className="min-h-[100px]" placeholder="Explain what was checked and what would help…" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="subtle" onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="danger" icon="x" onClick={confirmReject}>Confirm Rejection</Button>
        </div>
      </Modal>

      {/* ---------- START PROCESSING CONFIRM ---------- */}
      <ConfirmDialog
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onConfirm={() => {
          startProcessing(req.id);
          toast(`Processing started for ${req.id}.`, "info", "The user has been notified.");
        }}
        title="Start processing this request?"
        body={<>The status moves to <span className="font-semibold text-ink">Processing</span> and the user is notified that your team is working on their document.</>}
        confirmLabel="Start Processing"
      />

      {/* ---------- COMPLETE CONFIRM ---------- */}
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={submitComplete}
        title="Mark request as completed?"
        body={<>
          <p>The completed file <span className="font-semibold text-ink">{compFile?.name}</span> will be attached to the request, and the user will be notified that their document is ready to download.</p>
          <p className="mt-2 text-[12px] text-ink-faint">This is the final step of the workflow.</p>
        </>}
        confirmLabel="Mark as Completed"
      />
    </div>
  );
}
