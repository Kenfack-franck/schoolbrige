"use client";

import { TYPE_DOT_COLOR, TYPE_LABEL, type AgendaItem } from "@/components/CalendarView";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysDiff(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatRelative(dateStr: string): string {
  const diff = daysDiff(dateStr);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff <= 6) return `In ${diff} days`;
  if (diff > 6 && diff <= 13) return `In ${diff} days`;
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  const d = new Date(dateStr + "T00:00:00");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function getTypeIcon(type: AgendaItem["type"]): string {
  const icons: Record<AgendaItem["type"], string> = {
    reunion: "📋", examen: "📝", echeance: "⏰",
    tache: "✅", vacances: "🏖️", evenement: "🎉", bulletin: "📊",
  };
  return icons[type] ?? "📅";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AgendaListViewProps {
  events: AgendaItem[];
  onToggleDone: (item: AgendaItem) => void;
}

export default function AgendaListView({ events, onToggleDone }: AgendaListViewProps) {
  const today = todayStr();

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-line p-8 text-center" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <p className="text-muted text-sm">No events in the agenda.</p>
        <p className="text-xs text-muted mt-1">Events added via the chat will appear here.</p>
      </div>
    );
  }

  // Sort: overdue first, then upcoming by date, then done at the bottom
  const overdue = events.filter(
    (e) => e.date < today && !e.fait && (e.type === "tache" || e.type === "echeance")
  );
  const upcoming = events.filter(
    (e) => e.date >= today && !(overdue.includes(e))
  ).sort((a, b) => a.date.localeCompare(b.date));
  const done = events.filter(
    (e) => e.fait && !overdue.includes(e) && !upcoming.includes(e)
  ).sort((a, b) => b.date.localeCompare(a.date));

  const sorted = [...overdue, ...upcoming, ...done];

  // Group with date separators for upcoming
  let lastDateLabel = "";

  return (
    <div className="flex flex-col">
      {/* Timeline wrapper */}
      <div className="relative pl-6">
        {/* Vertical timeline line */}
        <div
          className="absolute left-2 top-2 bottom-2 w-0.5 rounded-full"
          style={{ background: "var(--color-line)" }}
        />

        {sorted.map((item) => {
          const isPast = item.date < today;
          const isOverdue = isPast && !item.fait && (item.type === "tache" || item.type === "echeance");
          const isDone = item.fait;
          const diff = daysDiff(item.date);
          const dateLabel = isOverdue ? "Overdue" : formatRelative(item.date);
          const showSeparator = !isDone && dateLabel !== lastDateLabel;
          if (!isDone) lastDateLabel = dateLabel;

          return (
            <div key={item.id}>
              {/* Date separator */}
              {showSeparator && (
                <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                  <div
                    className="absolute left-0 w-4 h-4 rounded-full border-2 border-white z-10 flex items-center justify-center"
                    style={{ background: isOverdue ? "#C43E3E" : "var(--color-primary)" }}
                  />
                  <span
                    className="text-xs font-display font-semibold"
                    style={{ color: isOverdue ? "#C43E3E" : "var(--color-primary)" }}
                  >
                    {dateLabel}
                  </span>
                  {!isOverdue && diff > 0 && (
                    <span className="text-xs text-muted">— {formatDate(item.date)}</span>
                  )}
                </div>
              )}

              {/* Event card */}
              <div className="relative mb-3">
                {/* Timeline node */}
                <div
                  className="absolute -left-4 top-4 w-2 h-2 rounded-full border border-white z-10"
                  style={{ background: TYPE_DOT_COLOR[item.type] }}
                />

                <div
                  className={`rounded-xl border p-4 transition-all duration-200 ${
                    isOverdue
                      ? "bg-red-50 border-red-200"
                      : isDone
                      ? "border-line opacity-50"
                      : "bg-white border-line hover:shadow-sm"
                  }`}
                  style={
                    !isOverdue && !isDone
                      ? { borderLeftWidth: "3px", borderLeftColor: TYPE_DOT_COLOR[item.type], boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }
                      : isOverdue
                      ? { borderLeftWidth: "3px", borderLeftColor: "#C43E3E" }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg leading-none">{getTypeIcon(item.type)}</span>
                        <p
                          className={`text-base font-semibold leading-snug ${
                            isDone ? "line-through text-muted" : "text-foreground"
                          }`}
                        >
                          {item.titre}
                        </p>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: `${TYPE_DOT_COLOR[item.type]}18`, color: TYPE_DOT_COLOR[item.type] }}
                        >
                          {TYPE_LABEL[item.type]}
                        </span>
                        {isOverdue && (
                          <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full shrink-0">
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {item.heure && (
                          <span className="text-sm text-muted">🕐 {item.heure}</span>
                        )}
                        {item.lieu && (
                          <span className="text-sm text-muted">📍 {item.lieu}</span>
                        )}
                        {item.enfant_concerne && (
                          <span className="text-xs bg-primary-lighter text-primary px-2 py-0.5 rounded-full">
                            {item.enfant_concerne}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Done toggle */}
                    {(item.type === "tache" || item.type === "echeance") && (
                      <button
                        onClick={() => onToggleDone(item)}
                        className={`shrink-0 flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                          isDone
                            ? "bg-success text-white"
                            : "border border-line text-muted hover:border-success hover:text-success"
                        }`}
                        title={isDone ? "Mark as not done" : "Mark as done"}
                      >
                        {isDone ? "✓ Done" : "✓ Done"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
