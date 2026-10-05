import { useStore } from "../lib/store";
import { Button, Card, Flourish, Icon, PageHeader, Reveal, SectionHeading } from "../components/ui";

const services = [
  {
    icon: "quill",
    title: "Transcription & Transliteration",
    body: "Faded or difficult handwriting rendered word-for-word into clean modern text. Illegible parts are honestly marked, never guessed.",
    typical: "Typical: 3–10 working days",
    items: ["Letters & diaries", "Deeds & ledgers", "Multi-image sets"],
  },
  {
    icon: "book",
    title: "Translation & Interpretation",
    body: "Older languages and regional scripts translated into your everyday language, with notes where the original wording matters.",
    typical: "Typical: 5–12 working days",
    items: ["Historical languages", "Legal & formal register", "Glossary of terms"],
  },
  {
    icon: "eye",
    title: "Legibility Review & Restoration Notes",
    body: "We assess how much of a damaged or faded document is still readable, and tell you honestly what can and cannot be recovered.",
    typical: "Typical: 2–5 working days",
    items: ["Damage assessment", "Reading confidence notes", "Re-scan guidance"],
  },
  {
    icon: "ledger",
    title: "Summary & Indexed Reference",
    body: "Long documents distilled into a readable summary with an index of names, places and dates — built by a reader who has read the whole thing.",
    typical: "Typical: 5–14 working days",
    items: ["Key-facts summary", "Name & date index", "Chapter / page map"],
  },
];

const formats = [
  { icon: "doc", label: "PDF" },
  { icon: "doc", label: "Word (.docx)" },
  { icon: "image", label: "Print-ready images" },
  { icon: "ledger", label: "Table / CSV sheets" },
  { icon: "book", label: "Bound-style layout" },
];

export default function Services() {
  const { user } = useStore();
  return (
    <div className="pb-8">
      <PageHeader
        overline="Services"
        title="What we can do with your document"
        lead="Every engagement begins with a human reading your document. The work itself is done manually — carefully, and with the record respected."
      />

      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <Card ticks className="group h-full p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="corner-ticks grid h-12 w-12 place-items-center border border-line bg-parchment/50 text-accent transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon name={s.icon} size={22} />
                  </span>
                  <span className="border border-line bg-cream px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">{s.typical}</span>
                </div>
                <h3 className="mt-5 font-display text-[23px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{s.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.items.map((it) => (
                    <li key={it} className="border border-line bg-cream px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
                      {it}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-line-soft pt-4 text-[12.5px] text-ink-faint">
                  Exact charges are quoted per document after review — you always see the price before paying.
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <Card className="bg-parchment/40 p-8 sm:p-10">
            <SectionHeading
              align="left"
              overline="Output formats"
              title="Delivered the way you want to read it"
              lead="Choose your preferred format in the request form; we will confirm what works best for your document in the quote."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              {formats.map((f) => (
                <span key={f.label} className="corner-ticks flex items-center gap-2.5 border border-line bg-card px-4 py-2.5 text-[13px] font-medium text-ink">
                  <Icon name={f.icon} size={17} className="text-gold" /> {f.label}
                </span>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal className="mt-14 text-center">
          <div className="mb-8 flex justify-center text-gold/60">
            <Flourish />
          </div>
          <Button size="lg" to={user ? "/submit" : "/signup"} iconRight="arrowR">
            Discuss Your Document
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
