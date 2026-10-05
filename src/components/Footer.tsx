import { Link } from "react-router-dom";
import { brand } from "../config/brand";
import { Flourish, Icon, Seal } from "./ui";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-parchment/35">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Seal size={38} className="text-accent" />
              <span className="font-display text-lg font-bold tracking-[0.16em] text-ink">{brand.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">{brand.footer.blurb}</p>
            <div className="mt-5 space-y-2 text-[12.5px] text-ink-soft">
              <p className="flex items-center gap-2.5">
                <Icon name="mail" size={15} className="text-gold" />
                <a href={`mailto:${brand.contact.email}`} className="hover:text-accent">{brand.contact.email}</a>
              </p>
              <p className="flex items-center gap-2.5">
                <Icon name="phone" size={15} className="text-gold" /> {brand.contact.phone}
              </p>
            </div>
          </div>
          {brand.footer.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-faint">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-[13.5px] text-ink-soft transition-colors hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center gap-4">
          <Flourish className="text-gold/60" />
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-[12px] text-ink-faint">
              © {new Date().getFullYear()} {brand.name} · All documents handled with care.
            </p>
            <p className="flex items-center gap-4 text-[12px] text-ink-faint">
              <a href={brand.social.instagram} className="transition-colors hover:text-accent">Instagram</a>
              <a href={brand.social.linkedin} className="transition-colors hover:text-accent">LinkedIn</a>
              <a href={brand.social.x} className="transition-colors hover:text-accent">X</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
