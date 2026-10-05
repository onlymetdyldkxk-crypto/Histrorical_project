import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { downloadMockFile, fmtBytes, fmtDate } from "../lib/utils";
import { Button, Card, EmptyState, Icon, KV, Reveal, StatusBadge } from "../components/ui";

export default function Completed() {
  const { id } = useParams();
  const { requests, toast } = useStore();
  const req = requests.find((r) => r.id === id);

  if (!req || req.status !== "completed" || !req.completion) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16">
        <EmptyState
          icon="clock"
          title="Not ready yet"
          body="This request is not completed yet. As soon as our team uploads your processed document, this page will be waiting for you."
          action={<Button to="/dashboard" variant="secondary" icon="arrowL">Back to My Requests</Button>}
        />
      </div>
    );
  }

  const c = req.completion;
  return (
    <div className="mx-auto max-w-4xl px-5 pt-12 text-center">
      <Reveal>
        <div className="relative mx-auto w-fit">
          <span className="stamp-in corner-ticks grid h-32 w-32 place-items-center border-2 border-moss/60 text-moss">
            <Icon name="seal" size={64} strokeWidth={1.2} />
          </span>
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap border border-moss/60 bg-paper px-2.5 text-[9.5px] font-bold uppercase tracking-[0.3em] text-moss">
            Completed
          </span>
        </div>
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Request {req.id}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Your Document Is Ready</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">{c.message}</p>
        <p className="mt-2 text-[12.5px] text-ink-faint">Completed on {fmtDate(c.completedAt)}</p>
      </Reveal>

      <div className="mt-10 grid gap-5 text-left sm:grid-cols-2">
        <Reveal delay={100}>
          <Card ticks className="h-full p-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Original document</p>
            <div className="mt-4 flex items-center gap-3.5">
              <span className="corner-ticks grid h-12 w-12 shrink-0 place-items-center border border-line bg-parchment/50 text-accent">
                <Icon name={req.document.kind === "drive" ? "link" : "doc"} size={22} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{req.document.fileName}</p>
                <p className="text-[11.5px] text-ink-faint">{req.document.kind === "drive" ? "Google Drive link" : fmtBytes(req.document.fileSize)}</p>
              </div>
            </div>
            <div className="mt-5">
              {req.document.kind === "drive" ? (
                <a
                  href={req.document.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-ink/25 px-4 py-2 text-[12.5px] font-medium transition-colors hover:border-accent/60 hover:text-accent"
                >
                  <Icon name="external" size={14} /> Open original
                </a>
              ) : (
                <Button variant="secondary" size="sm" icon="download" onClick={() => { downloadMockFile(req, "original"); toast("Original file (demo placeholder) downloaded.", "info"); }}>
                  Download original
                </Button>
              )}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={180}>
          <Card ticks className="h-full border-moss/40 p-6">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-moss">
              <Icon name="check" size={12} /> Completed document
            </p>
            <div className="mt-4 flex items-center gap-3.5">
              <span className="corner-ticks grid h-12 w-12 shrink-0 place-items-center border border-moss/40 bg-moss/8 text-moss">
                <Icon name="download" size={22} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{c.fileName}</p>
                <p className="text-[11.5px] text-ink-faint">{c.fileLabel}</p>
              </div>
            </div>
            <div className="mt-5">
              <Button className="w-full" icon="download" onClick={() => { downloadMockFile(req, "completed"); toast("Completed file (demo placeholder) downloaded.", "success"); }}>
                Download Completed File
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={240} className="mt-6">
        <Card className="p-7 text-left">
          <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
            <Icon name="hand" size={18} className="text-gold" /> A note from the person who worked on it
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">{c.note}</p>
          <div className="mt-5 grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-2">
            <KV k="Request ID" v={<span className="font-mono">{req.id}</span>} mono />
            <KV k="Status" v={<StatusBadge status={req.status} />} />
          </div>
        </Card>
      </Reveal>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button size="lg" icon="download" onClick={() => { downloadMockFile(req, "completed"); toast("Completed file (demo placeholder) downloaded.", "success"); }}>
          Download Completed File
        </Button>
        <Button size="lg" variant="secondary" to={`/requests/${req.id}`} icon="eye">
          View Request
        </Button>
      </div>

      <p className="mt-10 text-[12px] text-ink-faint">
        The processed file stays in your account, and the full history is on your{" "}
        <Link to="/dashboard" className="font-semibold text-accent hover:underline">dashboard</Link>.
      </p>
    </div>
  );
}
