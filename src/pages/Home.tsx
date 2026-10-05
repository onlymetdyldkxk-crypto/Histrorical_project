import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { Button, Card, Flourish, Icon, Reveal, SectionHeading, Seal } from "../components/ui";

const benefits = [
  { icon: "hand", title: "Manual Review", body: "A member of our team reads your document personally before anything else happens. No automation makes the first judgement." },
  { icon: "ledger", title: "Transparent Pricing", body: "You are never charged a guess. Charges are only set after we have examined your document, and you approve the quote before paying." },
  { icon: "clock", title: "Estimated Delivery Time", body: "Every accepted request comes with an expected completion date, so you always know when to expect your document back." },
  { icon: "shield", title: "Secure Document Handling", body: "Your files are handled discreetly, accessed only by the people working on them, and never shared beyond your request." },
];

const steps = [
  { n: "01", title: "Upload", body: "Add your document — a file, several images, or a Google Drive link." },
  { n: "02", title: "Tell Us Your Need", body: "Explain in plain words what you would like us to do with it." },
  { n: "03", title: "Admin Review", body: "Our team examines the document and accepts or declines the request." },
  { n: "04", title: "Get Your Quote", body: "You receive the processing charge and an estimated completion time." },
  { n: "05", title: "Pay", body: "Approve the quote and pay securely online to begin processing." },
  { n: "06", title: "Receive Your File", body: "We deliver the processed document, ready to read and to keep." },
];

const trustPoints = [
  "Your submitted documents are handled securely and discreetly.",
  "Your document is reviewed by a person before processing begins.",
  "Processing charges are confirmed in writing before payment.",
  "Your document will not be processed without your approval.",
];

export default function Home() {
  const { user } = useStore();
  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-[320px] w-[320px] rounded-full bg-accent/8 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <p className="mask-line text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
              <span style={{ animationDelay: "0.05s" }}>A human, hands-on service for the past</span>
            </p>
            <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.06] text-ink sm:text-[56px]">
              <span className="mask-line"><span style={{ animationDelay: "0.15s" }}>Make historical</span></span>
              <span className="mask-line"><span style={{ animationDelay: "0.28s" }}>documents easier</span></span>
              <span className="mask-line">
                <span style={{ animationDelay: "0.41s" }} className="relative inline-block italic text-accent">
                  to understand.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 220 12" fill="none" aria-hidden="true">
                    <path className="draw-path" d="M3 9c40-6 140-8 214-4" stroke="#96762f" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            </h1>
            <p className="mt-7 max-w-md text-[15.5px] leading-relaxed text-ink-soft">
              Submit your document, tell us what you need, and our team will review it, confirm a fair quote and process it
              by hand into a clear, readable format.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button size="lg" iconRight="arrowR" to={user ? "/submit" : "/signup"}>
                Submit a Document
              </Button>
              <Button size="lg" variant="secondary" to="/how-it-works">
                How It Works
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[12px] font-medium text-ink-soft">
              <span className="flex items-center gap-2"><Icon name="check" size={14} className="text-moss" /> No payment before a quote</span>
              <span className="flex items-center gap-2"><Icon name="check" size={14} className="text-moss" /> Reviewed by people, not machines</span>
              <span className="flex items-center gap-2"><Icon name="check" size={14} className="text-moss" /> Drive links welcome</span>
            </div>
          </div>

          {/* Hero visual — old page → readable page */}
          <Reveal delay={150} className="relative">
            <div className="corner-ticks relative border border-line bg-card p-3 shadow-lift">
              <img
                src="images/hero-manuscript.jpg"
                alt="An old handwritten manuscript beside a modern, clearly printed document"
                className="h-[340px] w-full object-cover sm:h-[400px]"
                loading="eager"
              />
            </div>
            <Card ticks className="absolute -left-4 -top-5 hidden w-44 bg-card/95 p-3.5 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-faint">Before</p>
              <div className="mt-2 space-y-1.5 opacity-70">
                {[92, 78, 88, 60].map((w, i) => (
                  <div key={i} className="h-[7px] w-full rounded-sm bg-ink/25" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="mt-2 font-display text-[11px] italic text-ink-faint">faded, difficult script</p>
            </Card>
            <Card ticks className="absolute -bottom-6 -right-3 hidden w-44 border-moss/40 bg-card/95 p-3.5 sm:block">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-moss">
                <Icon name="check" size={11} /> After
              </p>
              <div className="mt-2 space-y-1.5">
                {[100, 94, 97, 82].map((w, i) => (
                  <div key={i} className="h-[3px] w-full rounded-sm bg-ink/50" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="mt-2 font-display text-[11px] italic text-ink-soft">clear & readable</p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section id="about" className="border-y border-line bg-parchment/30">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <SectionHeading
            overline="Why families and researchers trust us"
            title="Careful work, plainly explained"
            lead="We keep the process small and human. Four things we do differently from the moment you arrive."
          />
          <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="group bg-card p-7 transition-colors duration-300 hover:bg-cream">
                <span className="corner-ticks grid h-11 w-11 place-items-center border border-line bg-parchment/50 text-accent transition-transform duration-300 group-hover:-translate-y-1">
                  <Icon name={b.icon} size={21} />
                </span>
                <h3 className="mt-5 font-display text-[21px] font-semibold text-ink">{b.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{b.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <SectionHeading
          overline="How it works"
          title="Six quiet steps, start to finish"
          lead="From your upload to your readable document. Every status is explained, and you are always told what happens next."
        />
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="relative">
              <div className="group h-full border border-line bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-4xl font-medium text-gold/60 transition-colors group-hover:text-gold">{s.n}</span>
                  {i < steps.length - 1 && <Icon name="arrowR" size={16} className="hidden text-line transition-colors group-hover:text-accent/50 lg:block" />}
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{s.body}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="absolute -right-[26px] top-1/2 hidden -translate-y-1/2 text-ink-faint lg:block">
                  <Icon name="arrowR" size={18} />
                </span>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 text-center">
          <Button size="lg" to={user ? "/submit" : "/signup"} iconRight="arrowR">
            Begin Your First Request
          </Button>
          <p className="mt-3 text-[12.5px] text-ink-faint">Takes about three minutes. Nothing is paid until we send you a quote.</p>
        </Reveal>
      </section>

      {/* ================= TRUST ================= */}
      <section className="border-y border-line bg-parchment/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="corner-ticks border border-line bg-card p-3 shadow-soft">
              <img src="images/archive-drawer.jpg" alt="An archival drawer with aged folders and a letter tied with twine" className="h-[300px] w-full object-cover sm:h-[360px]" loading="lazy" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              <span className="h-px w-8 bg-gold/50" /> Trust & care
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Your document leaves your hands only once — and it is treated like the record it is.
            </h2>
            <ul className="mt-8 space-y-4">
              {trustPoints.map((t) => (
                <li key={t} className="flex items-start gap-3.5 border-b border-line-soft pb-4 last:border-0">
                  <span className="corner-ticks mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-line bg-card text-moss">
                    <Icon name="shield" size={15} />
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-ink-soft">{t}</p>
                </li>
              ))}
            </ul>
            <Link to="/help" className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-accent hover:underline">
              Read how we handle documents <Icon name="arrowR" size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-24">
        <Reveal>
          <Seal size={46} className="mx-auto text-gold" />
          <h2 className="mt-6 font-display text-3xl font-semibold text-ink sm:text-4xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            One document is all it takes. Tell us about it, and we will tell you honestly whether we can help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" to={user ? "/submit" : "/signup"} icon="quill">
              Submit a Document
            </Button>
            <Button size="lg" variant="secondary" to="/services">
              Explore Services
            </Button>
          </div>
          <div className="mt-10 flex justify-center text-gold/60">
            <Flourish />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
