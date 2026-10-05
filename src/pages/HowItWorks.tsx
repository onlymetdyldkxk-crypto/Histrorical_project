import { useStore } from "../lib/store";
import { Button, Card, Icon, PageHeader, Reveal } from "../components/ui";

const phases = [
  {
    n: "01",
    icon: "upload",
    title: "You submit your document",
    body: "Create an account, then upload your document — a PDF, Word file, presentation, one or many images, or simply a Google Drive link. Nothing is converted or altered at this stage: your file is received exactly as you send it.",
    points: ["Unlimited reasonable file sizes", "Multiple images supported", "Google Drive links welcome"],
  },
  {
    n: "02",
    icon: "quill",
    title: "You explain what you need",
    body: "Tell us in your own words what you would like done — a transcription, a translation, a cleaned-up summary, an index. The more context you give, the more accurate our quote will be.",
    points: ["Plain-language brief", "Preferred output format", "Optional notes & instructions"],
  },
  {
    n: "03",
    icon: "eye",
    title: "A person reviews it",
    body: "A member of our team opens your document and reads it. We decide together whether the work is something we can do well. If not, we tell you plainly and explain why.",
    points: ["Manual, human review — always", "Accept or decline with reasons", "Nothing is processed yet"],
  },
  {
    n: "04",
    icon: "ledger",
    title: "You receive your quotation",
    body: "If we accept, you get a written quotation: the processing charge, an estimated completion time and an expected date, plus any notes from the reviewer. You approve it and pay only after seeing it.",
    points: ["Charge fixed before payment", "Estimated days + expected date", "No hidden fees, ever"],
  },
  {
    n: "05",
    icon: "hand",
    title: "Our team works on it by hand",
    body: "The processing itself — transcription, translation, cleanup, annotation — is done manually by our team, with care for every faded word. You can follow the status of your request at all times.",
    points: ["Manual processing only", "Status updates as things move", "Reviewer notes shared with you"],
  },
  {
    n: "06",
    icon: "download",
    title: "You receive your document",
    body: "When the work is finished, we upload the completed file to your request. You are notified and can download it any time — it stays in your account.",
    points: ["Notification on completion", "One-click download", "File remains in your account"],
  },
];

export default function HowItWorks() {
  const { user } = useStore();
  return (
    <div className="pb-8">
      <PageHeader
        overline="How it works"
        title="The journey of your document"
        lead="A deliberately unhurried process. Every step below happens with a human on each side of it — you, and our team."
      />

      <div className="mx-auto max-w-3xl px-5">
        <div className="relative">
          <span className="absolute bottom-8 left-[27px] top-8 hidden w-px border-l border-dashed border-line sm:block" aria-hidden="true" />
          <div className="space-y-8">
            {phases.map((p, i) => (
              <Reveal key={p.n} delay={i * 60}>
                <Card ticks className="relative pl-6 sm:ml-[72px]">
                  <span className="corner-ticks absolute -left-[72px] top-6 hidden h-[56px] w-[56px] place-items-center border border-line bg-parchment/60 font-display text-lg font-semibold text-accent sm:grid" style={{ gridTemplateRows: "1fr" }}>
                    {p.n}
                  </span>
                  <div className="flex items-start gap-4 p-6">
                    <span className="corner-ticks grid h-12 w-12 shrink-0 place-items-center border border-line bg-card text-accent sm:hidden">
                      <Icon name={p.icon} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center border border-line bg-parchment/50 text-accent sm:hidden">
                          <Icon name={p.icon} size={18} />
                        </span>
                        <h3 className="font-display text-[22px] font-semibold text-ink">{p.title}</h3>
                      </div>
                      <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{p.body}</p>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {p.points.map((pt) => (
                          <li key={pt} className="flex items-center gap-1.5 border border-line bg-cream px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
                            <Icon name="check" size={12} className="text-moss" /> {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="mt-14 border border-line bg-parchment/40 p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Good to know</p>
          <p className="mx-auto mt-3 max-w-lg font-display text-xl italic leading-relaxed text-ink">
            “We never promise a price before we have seen the document, and we never begin work before you have approved the quote and paid.”
          </p>
          <div className="mt-6">
            <Button size="lg" to={user ? "/submit" : "/signup"} iconRight="arrowR">
              Submit Your Document
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
