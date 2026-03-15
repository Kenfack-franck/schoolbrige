"use client";

import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Child {
  id: string;
  prenom: string;
  nom: string;
  age: number;
  classe: string;
  type_ecole: string;
  nom_ecole: string;
  moyenne_generale: number | null;
  matieres_fortes: string[];
  matieres_faibles: string[];
  competence_dominante: string;
  notes_recentes: Record<string, number>;
  besoins_particuliers: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#2A6F97", "#2D8A56", "#9B59B6", "#E8913A"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMoyenneInfo(m: number | null): {
  barColor: string;
  barWidth: string;
  label: string;
  labelColor: string;
} {
  if (m === null) {
    return { barColor: "", barWidth: "0%", label: "Not yet assessed", labelColor: "#6B7280" };
  }
  const pct = Math.round(((6 - m) / 5) * 100);
  if (m <= 2.0) return { barColor: "#22c55e", barWidth: `${Math.min(pct, 95)}%`, label: "Excellent", labelColor: "#15803d" };
  if (m <= 3.0) return { barColor: "#eab308", barWidth: `${pct}%`, label: "Good", labelColor: "#a16207" };
  if (m <= 4.0) return { barColor: "#f97316", barWidth: `${pct}%`, label: "Average", labelColor: "#c2410c" };
  return { barColor: "#ef4444", barWidth: `${Math.min(pct, 95)}%`, label: "Struggling", labelColor: "#b91c1c" };
}

function getNoteClass(n: number): string {
  if (n <= 2) return "bg-green-100 text-green-800";
  if (n === 3) return "bg-yellow-100 text-yellow-800";
  if (n === 4) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ChildCardProps {
  child: Child;
  colorIndex: number;
}

export default function ChildCard({ child, colorIndex }: ChildCardProps) {
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const initiales = `${child.prenom[0]}${child.nom[0]}`.toUpperCase();
  const { barColor, barWidth, label, labelColor } = getMoyenneInfo(child.moyenne_generale);

  // Sort notes: strong (low number) first, then weak
  const noteEntries = Object.entries(child.notes_recentes).sort((a, b) => a[1] - b[1]);

  return (
    <Card className="hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-all duration-200">
      <CardContent className="px-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ background: avatarColor }}
          >
            {initiales}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-lg leading-snug">
              {child.prenom} <span className="text-muted font-normal">{child.nom}</span>
            </p>
            <p className="text-base text-muted truncate">{child.classe} · {child.type_ecole}</p>
            <p className="text-sm text-muted opacity-70 truncate">{child.nom_ecole}</p>
          </div>
        </div>

        {/* Moyenne bar */}
        {child.moyenne_generale !== null ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Overall average</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-base">{child.moyenne_generale}</span>
                <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ color: labelColor, background: `${labelColor}18` }}>
                  {label}
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: barWidth, background: barColor }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-base text-muted bg-canvas-soft rounded-xl px-4 py-2.5">
            <span>📝</span>
            <span>Not yet assessed</span>
          </div>
        )}

        {/* Notes récentes — two columns */}
        {noteEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {/* Points forts */}
            <div>
              <p className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-2">
                ✅ Strengths
              </p>
              <div className="flex flex-col gap-1.5">
                {noteEntries
                  .filter(([, n]) => n <= 2)
                  .slice(0, 3)
                  .map(([mat, n]) => (
                    <div key={mat} className="flex items-center justify-between">
                      <span className="text-sm text-foreground truncate">{mat}</span>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ml-1 shrink-0 ${getNoteClass(n)}`}>
                        {n}
                      </span>
                    </div>
                  ))}
                {child.matieres_fortes
                  .filter((m) => !noteEntries.some(([mat, n]) => mat === m && n <= 2))
                  .slice(0, 2)
                  .map((m) => (
                    <span key={m} className="text-sm text-green-700 bg-green-50 rounded-full px-2.5 py-0.5 truncate">
                      {m}
                    </span>
                  ))}
              </div>
            </div>

            {/* À améliorer */}
            <div>
              <p className="text-sm font-semibold text-orange-600 flex items-center gap-1 mb-2">
                ⚠️ Needs improvement
              </p>
              <div className="flex flex-col gap-1.5">
                {noteEntries
                  .filter(([, n]) => n >= 4)
                  .slice(0, 3)
                  .map(([mat, n]) => (
                    <div key={mat} className="flex items-center justify-between">
                      <span className="text-sm text-foreground truncate">{mat}</span>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ml-1 shrink-0 ${getNoteClass(n)}`}>
                        {n}
                      </span>
                    </div>
                  ))}
                {child.matieres_faibles
                  .filter((m) => !noteEntries.some(([mat, n]) => mat === m && n >= 4))
                  .slice(0, 2)
                  .map((m) => (
                    <span key={m} className="text-sm text-orange-600 bg-orange-50 rounded-full px-2.5 py-0.5 truncate">
                      {m}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Competence + besoins */}
        <div className="flex flex-col gap-2.5">
          {child.competence_dominante && (
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
                style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
              >
                🧠 {child.competence_dominante}
              </span>
            </div>
          )}

          {child.besoins_particuliers && (
            <div className="flex items-start gap-2 text-sm bg-blue-50 text-blue-800 rounded-xl px-3 py-2.5">
              <span className="shrink-0">⚡</span>
              <span>{child.besoins_particuliers}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
