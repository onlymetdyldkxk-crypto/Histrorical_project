import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";
import { useStore } from "../lib/store";
import type { Stage } from "../lib/utils";
import { fmtDate, paymentMeta, statusMeta, type BadgeTone } from "../lib/utils";
import type { PaymentStatus, RequestStatus } from "../lib/types";

/* ============================= ICONS ============================= */

const paths: Record<string, React.ReactNode> = {
  quill: (
    <>
      <path d="M20.5 3.5C14 4.2 8.2 8 6.4 14L4 20l6.1-2.5C16 15.7 19.7 9.9 20.5 3.5Z" />
      <path d="M6.4 14l7.2-7.2" />
    </>
  ),
  seal: (
    <>
      <circle cx="12" cy="10" r="6.3" />
      <path d="M9.4 15.2 8 21l4-2.2L16 21l-1.4-5.8" />
      <path d="M12 7.2c1.6.4 2.4 1.3 2.4 2.6 0 1.6-1.1 2.6-2.6 3.1" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M9.5 12h5M9.5 16h5" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <circle cx="8.7" cy="9.7" r="1.3" />
      <path d="M4.5 16.5l4.5-4.5 3.8 3.8 2.7-2.7 4 4" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M8.2 11.8 5.7 14.3a3.4 3.4 0 004.8 4.8l2.5-2.5" />
      <path d="M15.8 12.2l2.5-2.5a3.4 3.4 0 00-4.8-4.8l-2.5 2.5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  bell: (
    <>
      <path d="M6 9.5a6 6 0 1112 0c0 4.8 1.8 5.8 1.8 5.8H4.2S6 14.3 6 9.5Z" />
      <path d="M10 19a2.2 2.2 0 004 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0115 0" />
    </>
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  arrowR: <path d="M4 12h15M13 6l6 6-6 6" />,
  arrowL: <path d="M20 12H5M11 6l-6 6 6 6" />,
  chevronD: <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5l5 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v6c0 4.5-3 7.6-7.5 9-4.5-1.4-7.5-4.5-7.5-9V6Z" />
      <path d="M8.7 12l2.3 2.3 4.3-4.6" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="10.5" width="12" height="10" rx="1" />
      <path d="M9 10.5V8a3 3 0 016 0v2.5M12 14.5v2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  edit: <path d="M4 20l1-4L16.5 4.5a2.12 2.12 0 013 3L8 19l-4 1Z" />,
  trash: <path d="M5 7h14M9.5 7V4.5h5V7M7.8 7l.8 13h6.8l.8-13M10.4 11v5.5M13.6 11v5.5" />,
  refresh: <path d="M4 12a8 8 0 0113.7-5.6L20 9M20 4.5V9h-4.5M20 12a8 8 0 01-13.7 5.6L4 15M4 19.5V15h4.5" />,
  filter: <path d="M4 5.5h16l-6.2 7.2V18l-3.6 2v-7.3Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  calendar: (
    <>
      <rect x="4.5" y="6" width="15" height="14" rx="1" />
      <path d="M4.5 10.5h15M9 3.5V8M15 3.5V8" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="1" />
      <path d="M4 7.5l8 5.5 8-5.5" />
    </>
  ),
  phone: <path d="M5.5 4h3.5l1.5 4.5-2.2 1.6a12.5 12.5 0 005.6 5.6l1.6-2.2L20 15v3.5a1.5 1.5 0 01-1.6 1.5C10 19.6 4.4 14 3.9 5.6A1.5 1.5 0 015.5 4Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6h.01" />
    </>
  ),
  alert: <path d="M12 3.5L21.5 20h-19ZM12 10v4.5M12 17.4h.01" />,
  send: <path d="M21 3.5L10.5 14M21 3.5l-6.8 17-3.7-6.9-6.9-3.7Z" />,
  folder: <path d="M3.5 6.5h5.8l2 2.2h9.2v10.6H3.5Z" />,
  external: <path d="M14 5h5v5M19 5l-8.5 8.5M19 13.5V19H5V5h5.5" />,
  book: (
    <>
      <path d="M5.5 4H17a2 2 0 012 2v13.5H7.5A2 2 0 015.5 17.5Z" />
      <path d="M19 16.5H7.5a2 2 0 00-2 2M9.5 8.5h5.5" />
    </>
  ),
  ledger: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1" />
      <path d="M9 3.5v17M12.5 8h3.5M12.5 12h3.5" />
    </>
  ),
  hand: (
    <>
      <path d="M8 12.5V6.2a1.4 1.4 0 012.8 0v5" />
      <path d="M10.8 11V4.7a1.4 1.4 0 012.8 0V11" />
      <path d="M13.6 11.3V6a1.4 1.4 0 012.8 0v6.5c0 4.2-2.3 7.5-5.7 7.5-3 0-4.2-1.8-5.8-4.6l-1.3-2.3a1.3 1.3 0 012.2-1.4L8 13.4" />
    </>
  ),
  stamp: (
    <>
      <path d="M12 4.5a2.8 2.8 0 012.8 2.8c0 1.9-1.1 2.9-1.1 4.2h-3.4c0-1.3-1.1-2.3-1.1-4.2A2.8 2.8 0 0112 4.5Z" />
      <path d="M5.5 15.5h13V19h-13zM4.5 21h15" />
    </>
  ),
  logout: <path d="M14.5 8V5.5h-9v13h9V16M9 12h10.5M17 9l3 3-3 3" />,
  gauge: (
    <>
      <path d="M4 15.5a8.5 8.5 0 1117 0" />
      <path d="M12 15.5l4.2-4.2" />
      <path d="M4 19h16" />
    </>
  ),
};

export function Icon({ name, size = 20, className, strokeWidth = 1.5 }: { name: keyof typeof paths | string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={cn("shrink-0", className)} aria-hidden="true">
      {paths[name] ?? paths.doc}
    </svg>
  );
}

/* ============================= ORNAMENTS ============================= */

export function Seal({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="18.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2.4 3" />
      <path d="M33.5 13.5c-6.5.7-11.6 4-13.3 9.6L18 30.4l6.3-2.5c5.7-2.6 8.7-8 9.2-14.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M18.6 23.8l6.5-6.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function Flourish({ className, width = 180 }: { className?: string; width?: number }) {
  return (
    <svg width={width} height="14" viewBox="0 0 180 14" fill="none" className={className} aria-hidden="true">
      <path d="M0 7h70" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M110 7h70" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M90 1.5l5.5 5.5L90 12.5 84.5 7 90 1.5Z" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="77" cy="7" r="1.6" fill="currentColor" opacity="0.7" />
      <circle cx="103" cy="7" r="1.6" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function SectionHeading({ overline, title, lead, align = "center", className }: { overline?: string; title: React.ReactNode; lead?: React.ReactNode; align?: "center" | "left"; className?: string }) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left", className)}>
      {overline && (
        <p className={cn("mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold", align === "center" && "flex items-center justify-center gap-3")}>
          {align === "center" && <span className="hidden h-px w-8 bg-gold/50 sm:block" />}
          {overline}
          {align === "center" && <span className="hidden h-px w-8 bg-gold/50 sm:block" />}
        </p>
      )}
      <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{lead}</p>}
    </div>
  );
}

export function PageHeader({ overline, title, lead, children }: { overline?: string; title: React.ReactNode; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-14 text-center sm:pt-20">
      <Reveal>
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{overline}</p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">{title}</h1>
        {lead && <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">{lead}</p>}
        <div className="mt-7 flex justify-center text-gold/70">
          <Flourish />
        </div>
        {children}
      </Reveal>
    </div>
  );
}

/* ============================= REVEAL ============================= */

export function Reveal({ children, delay = 0, className, as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: any }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={cn("reveal", inView && "is-in", className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

/* ============================= BUTTONS ============================= */

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-all duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 whitespace-nowrap cursor-pointer";
const btnSizes = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-[15px]",
};
const btnVariants = {
  primary: "bg-accent text-cream border border-accent-deep/40 shadow-soft hover:bg-accent-deep hover:shadow-lift",
  secondary: "border border-ink/25 bg-transparent text-ink hover:border-accent/60 hover:text-accent hover:bg-accent/5",
  subtle: "border border-line bg-parchment/60 text-ink hover:bg-parchment hover:border-ink/25",
  ghost: "text-ink-soft hover:text-accent hover:bg-ink/5",
  danger: "border border-accent/40 bg-transparent text-accent hover:bg-accent/10",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className,
  children,
  to,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants;
  size?: keyof typeof btnSizes;
  icon?: string;
  iconRight?: string;
  to?: string;
}) {
  const cls = cn(btnBase, btnSizes[size], btnVariants[variant], className);
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === "lg" ? 18 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 18 : 16} />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

/* ============================= BADGES ============================= */

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ink/6 text-ink-soft border-ink/15",
  slate: "bg-[#3d4a5c]/10 text-[#3d4a5c] border-[#3d4a5c]/30",
  amber: "bg-[#8a6d1f]/10 text-[#7a5f18] border-[#8a6d1f]/30",
  green: "bg-moss/12 text-moss border-moss/30",
  red: "bg-accent/10 text-accent-deep border-accent/30",
  gold: "bg-gold/12 text-[#7a5f1e] border-gold/35",
  clay: "bg-clay/12 text-[#8a4322] border-clay/35",
  teal: "bg-[#3f6b5e]/12 text-[#38594f] border-[#3f6b5e]/30",
  indigo: "bg-[#4a4d7a]/12 text-[#42456e] border-[#4a4d7a]/30",
  moss: "bg-moss/14 text-[#49573a] border-moss/35",
};

export function Badge({ tone = "neutral", children, className, dot = true }: { tone?: BadgeTone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide", toneClasses[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const m = statusMeta[status];
  return (
    <Badge tone={m.tone} className={className}>
      {m.label}
    </Badge>
  );
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  const m = paymentMeta[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

/* ============================= CARD ============================= */

export function Card({ className, children, ticks = false }: { className?: string; children: React.ReactNode; ticks?: boolean }) {
  return (
    <div className={cn("border border-line bg-card shadow-soft", ticks && "corner-ticks", className)}>{children}</div>
  );
}

export function StatCard({ label, value, icon, hint, tone = "neutral", to }: { label: string; value: React.ReactNode; icon: string; hint?: string; tone?: BadgeTone; to?: string }) {
  const inner = (
    <div className={cn("group h-full border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift", to && "cursor-pointer")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
          <p className="mt-2 font-display text-4xl font-semibold leading-none text-ink">{value}</p>
          {hint && <p className="mt-2.5 text-xs text-ink-soft">{hint}</p>}
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md border", toneClasses[tone])}>
          <Icon name={icon} size={19} />
        </span>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* ============================= FORMS ============================= */

export function Field({ label, hint, error, required, optional, children, className }: { label: string; hint?: string; error?: string; required?: boolean; optional?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-accent" aria-hidden="true">*</span>}
        {optional && <span className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">optional</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs leading-relaxed text-ink-faint">{hint}</span>}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-accent">
          <Icon name="alert" size={13} /> {error}
        </span>
      )}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint/80 transition-colors focus:border-accent/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/15";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;
  return <input className={cn(inputCls, invalid && "border-accent/50 bg-accent/5", className)} {...rest} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;
  return <textarea className={cn(inputCls, "min-h-[110px] leading-relaxed", invalid && "border-accent/50 bg-accent/5", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputCls, "appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
      <Icon name="chevronD" size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
    </div>
  );
}

export function Checkbox({ checked, onChange, label, invalid }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; invalid?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 select-none">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-all",
          checked ? "border-accent bg-accent text-cream" : invalid ? "border-accent/60 bg-cream" : "border-ink/30 bg-cream hover:border-accent/50"
        )}
      >
        {checked && <Icon name="check" size={12} strokeWidth={2.4} />}
      </button>
      <span className="text-[13.5px] leading-relaxed text-ink-soft">{label}</span>
    </label>
  );
}

export function KV({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2.5 last:border-0">
      <dt className="text-[13px] text-ink-faint">{k}</dt>
      <dd className={cn("text-right text-[13px] font-medium text-ink", mono && "font-mono text-[12.5px]")}>{v}</dd>
    </div>
  );
}

/* ============================= MODAL / CONFIRM ============================= */

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-[80] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("anim-pop w-full border border-line bg-card shadow-lift", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-4">
          <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Confirm", tone = "primary" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: React.ReactNode; confirmLabel?: string; tone?: "primary" | "danger" }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm leading-relaxed text-ink-soft">{body}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="subtle" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ============================= STATES ============================= */

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("animate-spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingPanel({ label = "Loading…", icon = "search", className }: { label?: string; icon?: string; className?: string }) {
  return (
    <div className={cn("anim-fade flex flex-col items-center justify-center gap-4 border border-dashed border-line bg-card/60 px-6 py-16 text-ink-soft", className)}>
      <Spinner size={26} className="text-gold" />
      <p className="flex items-center gap-2.5 text-sm tracking-wide">
        <Icon name={icon} size={16} className="text-ink-faint" /> {label}
      </p>
    </div>
  );
}

export function EmptyState({ icon = "folder", title, body, action, className }: { icon?: string; title: string; body?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("anim-fade flex flex-col items-center border border-dashed border-line bg-card/50 px-6 py-14 text-center", className)}>
      <span className="corner-ticks mb-5 grid h-14 w-14 place-items-center border border-line bg-parchment/50 text-gold">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ============================= STEPPER (wizard) ============================= */

export function Stepper({ steps, current, onStep }: { steps: string[]; current: number; onStep?: (i: number) => void }) {
  return (
    <ol className="flex items-center justify-center gap-0" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center">
            {i > 0 && <span className={cn("mx-1.5 h-px w-6 sm:mx-2.5 sm:w-12", done || active ? "bg-accent/50" : "bg-line")} />}
            <button
              type="button"
              disabled={!onStep || i > current}
              onClick={() => onStep && i < current && onStep(i)}
              className={cn("group flex flex-col items-center gap-1.5", onStep && i < current && "cursor-pointer")}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border text-[12px] font-semibold transition-all",
                  done && "border-accent bg-accent text-cream",
                  active && "border-accent bg-card text-accent shadow-soft ring-4 ring-accent/12",
                  !done && !active && "border-line bg-card text-ink-faint"
                )}
              >
                {done ? <Icon name="check" size={13} strokeWidth={2.2} /> : i + 1}
              </span>
              <span className={cn("hidden text-[10.5px] font-semibold uppercase tracking-wider sm:block", active ? "text-accent" : done ? "text-ink-soft" : "text-ink-faint")}>
                {s}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================= TIMELINE ============================= */

export function Timeline({ stages, compact }: { stages: Stage[]; compact?: boolean }) {
  return (
    <ol className="relative">
      {stages.map((s, i) => {
        const last = i === stages.length - 1;
        return (
          <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-14px)] w-px",
                  s.state === "done" ? "bg-accent/40" : "border-l border-dashed border-line"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full border",
                s.state === "done" && "border-accent bg-accent text-cream",
                s.state === "current" && "border-gold bg-gold/15 text-gold ring-4 ring-gold/10",
                s.state === "rejected" && "border-accent bg-accent/10 text-accent",
                s.state === "pending" && "border-line bg-card text-ink-faint/60"
              )}
            >
              {s.state === "done" && <Icon name="check" size={11} strokeWidth={2.4} />}
              {s.state === "rejected" && <Icon name="x" size={10} strokeWidth={2.4} />}
              {s.state === "current" && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
              {s.state === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-line" />}
            </span>
            <div className={cn("min-w-0", compact ? "pt-0.5" : "pt-0.5")}>
              <p className={cn("text-[13.5px] font-semibold leading-tight", s.state === "pending" ? "text-ink-faint" : s.state === "rejected" ? "text-accent" : "text-ink")}>
                {s.label}
              </p>
              {(s.date || s.detail) && (
                <p className="mt-0.5 text-[11.5px] text-ink-faint">
                  {s.date ? fmtDate(s.date) : ""}
                  {s.date && s.detail ? " · " : ""}
                  {s.detail}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ============================= TOASTS ============================= */

export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  const tones: Record<string, string> = {
    info: "border-l-[#3d4a5c]",
    success: "border-l-moss",
    warning: "border-l-clay",
    danger: "border-l-accent",
  };
  const icons: Record<string, string> = { info: "info", success: "check", warning: "alert", danger: "alert" };
  const iconTones: Record<string, string> = { info: "text-[#3d4a5c]", success: "text-moss", warning: "text-clay", danger: "text-accent" };
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[95] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2.5 sm:left-auto sm:right-5 sm:translate-x-0">
      {toasts.map((t) => (
        <div key={t.id} className={cn("anim-pop pointer-events-auto flex items-start gap-3 border border-line border-l-[3px] bg-card px-4 py-3.5 shadow-lift", tones[t.tone])}>
          <Icon name={icons[t.tone]} size={17} className={cn("mt-0.5", iconTones[t.tone])} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{t.body}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-ink-faint transition-colors hover:text-ink" aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
