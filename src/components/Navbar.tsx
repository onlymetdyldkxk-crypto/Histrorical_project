import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { brand } from "../config/brand";
import { useStore } from "../lib/store";
import { timeAgo } from "../lib/utils";
import { Badge, Button, Icon, Seal } from "./ui";
import { cn } from "../utils/cn";

const toneDot: Record<string, string> = { info: "bg-[#3d4a5c]", success: "bg-moss", warning: "bg-clay", danger: "bg-accent" };

export default function Navbar() {
  const { user, logout, visibleNotifications, markRead, markAllRead } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unread = visibleNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileOpen(false);
    setBellOpen(false);
    setUserOpen(false);
  }, [loc.pathname, loc.hash]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const navLinks = brand.nav.map((l) => ({ ...l, show: l.to !== "/dashboard" || user }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/88 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
        {/* Brand */}
        <Link to={user && user.role === "admin" ? "/admin" : "/"} className="group flex items-center gap-3">
          <Seal size={36} className="text-accent transition-transform duration-500 group-hover:rotate-[18deg]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] font-bold tracking-[0.16em] text-ink">{brand.name}</span>
            <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.26em] text-ink-faint">Modi Script Transliteration</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks
            .filter((l) => l.show)
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 px-3.5 py-2 text-[13.5px] font-medium tracking-wide transition-colors",
                    isActive ? "border-accent/70 text-accent" : "border-transparent text-ink-soft hover:border-line hover:text-ink"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {user && (
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setBellOpen((v) => !v);
                  setUserOpen(false);
                }}
                className="relative grid h-10 w-10 place-items-center rounded-md border border-transparent text-ink-soft transition-colors hover:border-line hover:bg-card hover:text-ink"
                aria-label="Notifications"
              >
                <Icon name="bell" size={19} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-accent px-1 text-[9.5px] font-bold text-cream">
                    {unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="anim-pop absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-2.5rem)] border border-line bg-card shadow-lift">
                  <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">Notifications</p>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-[11px] font-medium text-accent hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {visibleNotifications.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-faint">No notifications yet.</p>}
                    {visibleNotifications.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={cn("flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-0 hover:bg-parchment/40", !n.read && "bg-accent/[0.045]")}
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-line" : toneDot[n.tone])} />
                        <span className="min-w-0">
                          <span className={cn("block truncate text-[12.5px]", n.read ? "font-medium text-ink-soft" : "font-semibold text-ink")}>{n.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-ink-faint">{n.body}</span>
                          <span className="mt-1 block text-[10.5px] text-ink-faint/80">{timeAgo(n.at)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <Link to="/notifications" className="block border-t border-line-soft px-4 py-2.5 text-center text-[12px] font-semibold text-accent transition-colors hover:bg-accent/5">
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}

          {!user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" to="/login">
                Log in
              </Button>
              <Button size="sm" to="/signup">
                Sign Up
              </Button>
            </div>
          ) : (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen((v) => !v);
                  setBellOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-md border border-line bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:border-ink/25"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-display text-[13px] font-bold text-cream">
                  {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <span className="hidden max-w-[110px] truncate text-[12.5px] font-semibold text-ink md:block">{user.name}</span>
                <Icon name="chevronD" size={13} className="text-ink-faint" />
              </button>
              {userOpen && (
                <div className="anim-pop absolute right-0 top-full mt-2 w-56 border border-line bg-card shadow-lift">
                  <div className="border-b border-line-soft px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-[11.5px] text-ink-faint">{user.email}</p>
                  </div>
                  <div className="py-1.5">
                    <MenuItem to={user.role === "admin" ? "/admin" : "/dashboard"} icon="ledger" label={user.role === "admin" ? "Admin panel" : "Dashboard"} />
                    <MenuItem to="/notifications" icon="bell" label="Notifications" />
                    {user.role === "admin" && <MenuItem to="/dashboard" icon="folder" label="All requests" />}
                    <button
                      onClick={() => {
                        logout();
                        nav("/");
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-accent transition-colors hover:bg-accent/5"
                    >
                      <Icon name="logout" size={16} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-md border border-line bg-card text-ink lg:hidden"
            aria-label="Menu"
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={19} />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="anim-fade border-t border-line bg-paper px-5 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col">
            {navLinks
              .filter((l) => l.show)
              .map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn("border-b border-line-soft py-3.5 text-[15px] font-medium", isActive ? "text-accent" : "text-ink-soft")
                  }
                >
                  {l.label}
                </NavLink>
              ))}
          </nav>
          {!user && (
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" to="/login">
                Log in
              </Button>
              <Button className="flex-1" to="/signup">
                Sign Up
              </Button>
            </div>
          )}
          {user && (
            <div className="mt-5 flex items-center justify-between border border-line bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-sm font-bold text-cream">
                  {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{user.name}</p>
                  <p className="text-[11px] text-ink-faint">{user.role === "admin" ? "Administrator" : "Account holder"}</p>
                </div>
              </div>
              <Badge tone={user.role === "admin" ? "gold" : "neutral"} className="hidden sm:inline-flex">
                {user.role === "admin" ? "Admin" : "User"}
              </Badge>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MenuItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-parchment/50 hover:text-ink">
      <Icon name={icon} size={16} /> {label}
    </Link>
  );
}
