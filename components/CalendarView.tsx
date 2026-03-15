"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  parentId: string;
  titre: string;
  date: string;
  heure: string | null;
  lieu: string | null;
  enfant_concerne: string | null;
  type: "reunion" | "examen" | "echeance" | "tache" | "vacances" | "evenement" | "bulletin";
  source: string;
  description: string;
  fait: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JOURS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MOIS_FR = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MOIS_PARSE: [string, number][] = [
  ["january", 1], ["february", 2], ["march", 3], ["april", 4],
  ["may", 5], ["june", 6], ["july", 7], ["august", 8],
  ["september", 9], ["october", 10], ["november", 11], ["december", 12],
];

export const TYPE_DOT_COLOR: Record<AgendaItem["type"], string> = {
  reunion:  "#2A6F97",
  examen:   "#C43E3E",
  echeance: "#E8913A",
  tache:    "#E8913A",
  vacances: "#2D8A56",
  evenement:"#9B59B6",
  bulletin: "#D4A017",
};

export const TYPE_LABEL: Record<AgendaItem["type"], string> = {
  reunion:  "Meeting",
  examen:   "Exam",
  echeance: "Deadline",
  tache:    "Task",
  vacances: "Holidays",
  evenement:"Event",
  bulletin: "Report card",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVacanceEndDate(description: string, startDateStr: string): string | null {
  const startYear = parseInt(startDateStr.slice(0, 4));
  const desc = description.toLowerCase();
  for (const [name, num] of MOIS_PARSE) {
    const regex = new RegExp(`au\\s+(\\d{1,2})\\s+${name}(?:\\s+(\\d{4}))?`);
    const match = desc.match(regex);
    if (match) {
      const day = parseInt(match[1]);
      const year = match[2] ? parseInt(match[2]) : startYear;
      return `${year}-${String(num).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return null;
}

function isoToDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Mon=0, ..., Sun=6
function dayOfWeek(year: number, month: number, day: number): number {
  const d = new Date(year, month, day).getDay();
  return d === 0 ? 6 : d - 1;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CalendarViewProps {
  events: AgendaItem[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const today = todayStr();

  // Close popover when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Build vacation date ranges for this month
  const vacationRanges: Array<{ start: string; end: string }> = events
    .filter((e) => e.type === "vacances")
    .map((e) => {
      const end = parseVacanceEndDate(e.description, e.date);
      return { start: e.date, end: end ?? e.date };
    });

  function isVacationDay(dateStr: string): boolean {
    return vacationRanges.some(({ start, end }) => dateStr >= start && dateStr <= end);
  }

  // Map events by date for this month
  const eventsByDate = new Map<string, AgendaItem[]>();
  events.forEach((evt) => {
    const existing = eventsByDate.get(evt.date) ?? [];
    eventsByDate.set(evt.date, [...existing, evt]);
  });

  // Calendar grid
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstOffset = dayOfWeek(viewYear, viewMonth, 1);
  const totalCells = Math.ceil((firstOffset + totalDays) / 7) * 7;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  }

  function handleDayClick(day: number) {
    const dayEvents = eventsByDate.get(
      `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    ) ?? [];
    if (dayEvents.length === 0) { setSelectedDay(null); return; }
    setSelectedDay(prev => (prev === day ? null : day));
  }

  const selectedDateStr = selectedDay
    ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedEvents = selectedDateStr ? (eventsByDate.get(selectedDateStr) ?? []) : [];

  return (
    <div className="bg-white rounded-2xl border border-line overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-canvas-muted transition-colors text-base font-bold"
        >
          ◀
        </button>
        <h3 className="font-display font-semibold text-foreground text-base">
          {MOIS_FR[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:bg-canvas-muted transition-colors text-base font-bold"
        >
          ▶
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-line">
        {JOURS.map((j) => (
          <div key={j} className="text-center text-xs font-semibold text-muted py-2 uppercase tracking-wide">
            {j}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div ref={gridRef} className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, idx) => {
          const day = idx - firstOffset + 1;
          const isCurrentMonth = day >= 1 && day <= totalDays;
          const dateStr = isCurrentMonth
            ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null;
          const isToday = dateStr === today;
          const isPast = dateStr ? dateStr < today : false;
          const isVacation = dateStr ? isVacationDay(dateStr) : false;
          const dayEvents = dateStr ? (eventsByDate.get(dateStr) ?? []) : [];
          const isSelected = selectedDay === day && isCurrentMonth;
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={idx}
              onClick={() => isCurrentMonth && handleDayClick(day)}
              className={`relative min-h-[68px] md:min-h-[84px] px-1 pt-1.5 pb-1 border-b border-r border-line transition-colors ${
                isCurrentMonth && hasEvents ? "cursor-pointer" : ""
              } ${
                isVacation && isCurrentMonth ? "bg-green-50" : ""
              } ${
                isSelected ? "bg-primary-lighter" : isCurrentMonth && hasEvents ? "hover:bg-canvas-soft" : ""
              }`}
            >
              {/* Day number */}
              {isCurrentMonth && (
                <div className="flex justify-start">
                  <span
                    className={`text-sm w-6 h-6 flex items-center justify-center rounded-full font-medium leading-none ${
                      isToday
                        ? "text-white font-bold"
                        : isPast
                        ? "text-muted opacity-60"
                        : "text-foreground"
                    }`}
                    style={isToday ? { background: "var(--color-primary)" } : {}}
                  >
                    {day}
                  </span>
                </div>
              )}

              {/* Event dots */}
              {isCurrentMonth && dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap mt-1 pl-0.5">
                  {dayEvents.slice(0, 3).map((evt, i) => (
                    <span
                      key={i}
                      className="block w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: TYPE_DOT_COLOR[evt.type] }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-muted leading-none">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day events panel */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="border-t border-line bg-canvas-soft px-5 py-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-muted uppercase tracking-wide">
            {selectedDay} {MOIS_FR[viewMonth]} {viewYear}
          </p>
          {selectedEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2 bg-white rounded-xl border border-line px-4 py-3"
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: TYPE_DOT_COLOR[evt.type], minHeight: "24px" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-base font-semibold text-foreground leading-snug">{evt.titre}</p>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${TYPE_DOT_COLOR[evt.type]}20`, color: TYPE_DOT_COLOR[evt.type] }}
                  >
                    {TYPE_LABEL[evt.type]}
                  </span>
                </div>
                {evt.heure && (
                  <p className="text-sm text-muted mt-0.5">🕐 {evt.heure}</p>
                )}
                {evt.lieu && (
                  <p className="text-sm text-muted">📍 {evt.lieu}</p>
                )}
                {evt.enfant_concerne && (
                  <span className="inline-block text-xs bg-primary-lighter text-primary px-2 py-0.5 rounded-full mt-0.5">
                    {evt.enfant_concerne}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vacation legend (if vacation days visible in this month) */}
      {vacationRanges.some(({ start, end }) => {
        const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
        return start.startsWith(monthStr) || end.startsWith(monthStr) ||
          (start < monthStr + "-01" && end >= monthStr + "-01");
      }) && (
        <div className="border-t border-line px-4 py-2 flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 shrink-0" />
          <span className="text-[11px] text-muted">School holidays</span>
        </div>
      )}
    </div>
  );
}
