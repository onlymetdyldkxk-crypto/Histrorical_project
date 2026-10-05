import { useState } from "react";
import { brand } from "../config/brand";
import { useStore } from "../lib/store";
import { Button, Card, Icon, PageHeader, Reveal } from "../components/ui";
import { cn } from "../utils/cn";

const faqs = [
  {
    q: "What kinds of documents can I submit?",
    a: "Most historical or hard-to-read documents: PDFs, Word files, presentations, single images or sets of images, and Google Drive links. If you are unsure whether we can work with your document, submit it anyway — a person will review it and answer honestly.",
  },
  {
    q: "Do you use AI to convert my document?",
    a: "No. In this service, review, analysis and processing are done manually by our team. We believe documents of historical value deserve a human reader on every page.",
  },
  {
    q: "When do I pay?",
    a: "Only after our team has reviewed your document and sent you a written quotation. The quote states the exact charge and an estimated completion time. Nothing is processed before you approve and pay.",
  },
  {
    q: "What happens if you can't work with my document?",
    a: "We decline the request with a clear explanation of why, directly in your account. There is never a charge for a declined request, and you are welcome to resubmit with better material if we suggest it.",
  },
  {
    q: "How is my document handled?",
    a: "Submitted documents are stored privately and accessed only by the people assigned to your request. They are never shared, reused or displayed publicly.",
  },
  {
    q: "Can I change or add details after submitting?",
    a: "If your request is still under review, write to us with your request ID and we will update it. After processing has begun, changes are handled case by case.",
  },
  {
    q: "How will I know when my document is ready?",
    a: "You receive a notification in your account (and, once connected, by email) the moment your processed document is uploaded. The file also stays available in your account any time.",
  },
];

const statusHelp: [string, string][] = [
  ["Under Review", "Our team is reading your document and deciding whether we can take the request."],
  ["Quote Available", "We accepted the request. A charge and estimated time are shown — pay to begin."],
  ["Payment Pending", "The quote is agreed. Once payment is received, processing is scheduled."],
  ["Processing", "Our team is working on your document by hand. Sit tight."],
  ["Completed", "Your processed file is uploaded and ready to download."],
];

export default function Help() {
  const { user } = useStore();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="pb-8">
      <PageHeader
        overline="Help"
        title="Answers, before you even ask"
        lead="The things people most often want to know about submitting a document to us."
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 40}>
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left"
                    aria-expanded={open === i}
                  >
                    <span className={cn("font-display text-[18px] font-semibold", open === i ? "text-accent" : "text-ink")}>{f.q}</span>
                    <span className={cn("grid h-7 w-7 shrink-0 place-items-center border border-line text-ink-faint transition-transform duration-300", open === i && "rotate-180 border-accent/40 text-accent")}>
                      <Icon name="chevronD" size={14} />
                    </span>
                  </button>
                  <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden">
                      <p className="border-t border-line-soft px-6 py-4 text-[13.5px] leading-relaxed text-ink-soft">{f.a}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10">
            <Card ticks className="p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Understanding your statuses</p>
              <dl className="mt-4">
                {statusHelp.map(([s, d]) => (
                  <div key={s} className="grid gap-1 border-b border-line-soft py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-4">
                    <dt className="pt-0.5 text-[13px] font-semibold text-ink">{s}</dt>
                    <dd className="text-[13px] leading-relaxed text-ink-soft">{d}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        </div>

        <div className="space-y-6">
          <Reveal delay={100}>
            <Card ticks className="p-7" >
              <p id="contact" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Contact us</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink">A person answers.</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                Write to us with your request ID (if you have one) and we will reply within one working day.
              </p>
              <div className="mt-5 space-y-3 text-[13.5px] text-ink-soft">
                <p className="flex items-center gap-3">
                  <Icon name="mail" size={16} className="text-gold" />
                  <a className="hover:text-accent" href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>
                </p>
                <p className="flex items-center gap-3">
                  <Icon name="phone" size={16} className="text-gold" /> {brand.contact.phone}
                </p>
                <p className="flex items-start gap-3">
                  <Icon name="seal" size={16} className="mt-0.5 text-gold" /> {brand.contact.address}
                </p>
              </div>
              <div className="mt-6">
                <Button className="w-full" to={user ? "/submit" : "/signup"} iconRight="arrowR">
                  Submit a Document
                </Button>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={160}>
            <Card className="bg-parchment/40 p-7">
              <p id="privacy" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Privacy</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                Documents you submit are treated as private records. They are stored, reviewed and processed only for your
                request, and are never displayed, resold or used to train systems. This page is a placeholder for the full
                privacy policy, which will be published with the live service.
              </p>
              <p id="terms" className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Terms</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                Work begins only after a quote is accepted and payment received. Declined requests are never charged.
                Estimated completion times are honest estimates, not guarantees. Full terms will be published with the live service.
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
