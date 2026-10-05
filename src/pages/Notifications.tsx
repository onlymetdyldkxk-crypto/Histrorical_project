import { useSimulatedLoad, useStore } from "../lib/store";
import { fmtDateTime, timeAgo } from "../lib/utils";
import { Button, Card, EmptyState, Icon, LoadingPanel, PageHeader, Reveal } from "../components/ui";
import { cn } from "../utils/cn";

const toneBar: Record<string, string> = { info: "bg-[#3d4a5c]", success: "bg-moss", warning: "bg-clay", danger: "bg-accent" };

export default function Notifications() {
  const { visibleNotifications, markRead, markAllRead, user } = useStore();
  const loading = useSimulatedLoad(500);
  const unread = visibleNotifications.filter((n) => !n.read).length;

  return (
    <div className="pb-8">
      <PageHeader overline="Notifications" title="Your archive of updates" lead={user ? `Every message about your requests lands here, ${user.name.split(" ")[0]}.` : "Messages about your requests land here."} />
      <div className="mx-auto max-w-3xl px-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-[12.5px] text-ink-faint">
            {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? "s" : ""}
            {unread > 0 && <span className="ml-2 inline-flex items-center gap-1.5 text-accent">· {unread} unread</span>}
          </p>
          {unread > 0 && (
            <Button variant="subtle" size="sm" icon="check" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingPanel label="Loading notifications…" icon="bell" />
        ) : visibleNotifications.length === 0 ? (
          <EmptyState icon="bell" title="No notifications yet." body="When your request moves to a new stage — review, quote, payment, completion — you will see it here." />
        ) : (
          <div className="space-y-3">
            {visibleNotifications.map((n, i) => (
              <Reveal key={n.id} delay={i * 40}>
                <button
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "relative block w-full overflow-hidden border bg-card p-4.5 pl-6 text-left transition-all duration-200 hover:shadow-soft sm:p-5 sm:pl-7",
                    n.read ? "border-line-soft opacity-75 hover:opacity-100" : "border-line shadow-soft"
                  )}
                >
                  <span className={cn("absolute left-0 top-0 h-full w-1", toneBar[n.tone], n.read && "opacity-25")} />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={cn("text-[14px]", n.read ? "font-medium text-ink-soft" : "font-semibold text-ink")}>{n.title}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{n.body}</p>
                      <p className="mt-2 text-[11px] text-ink-faint" title={fmtDateTime(n.at)}>{timeAgo(n.at)} · {fmtDateTime(n.at)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" /> New
                      </span>
                    )}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="mt-8">
          <Card className="flex items-start gap-3.5 bg-parchment/40 p-5">
            <Icon name="info" size={17} className="mt-0.5 shrink-0 text-gold" />
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Delivery note.</span> In this demo, notifications appear in-app only. When the service goes
              live, these same events will also be delivered by email (and optionally SMS/WhatsApp) through the backend and
              automation workflows.
            </p>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
