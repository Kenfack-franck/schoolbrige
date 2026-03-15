"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonneRessource {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  langues: string[];
  sujets_expertise: string[];
  accepte_contact_plateforme: boolean;
  disponibilite: string;
  description: string;
  ecole_rattachee?: string;
  contact_externe?: {
    telephone?: string;
    email?: string;
    adresse?: string;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("parent") || r.includes("buddy")) return "#E8913A";
  if (r.includes("secrétariat") || r.includes("secretariat") || r.includes("administration")) return "#2A6F97";
  if (r.includes("conseiller") || r.includes("orientation")) return "#9B59B6";
  if (r.includes("médiatrice") || r.includes("mediatrice") || r.includes("interculturel")) return "#2D8A56";
  if (r.includes("enseignant") || r.includes("professeur")) return "#2A6F97";
  return "#6B7280";
}

function getRoleBadgeStyle(role: string): React.CSSProperties {
  const color = getRoleColor(role);
  return { background: `${color}18`, color };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ContactCardProps {
  personne: PersonneRessource;
  contexte?: string;
  parentId: string | null;
  onContact: (p: PersonneRessource) => void;
}

export default function ContactCard({ personne, contexte, parentId, onContact }: ContactCardProps) {
  const avatarColor = getRoleColor(personne.role);
  const initiales = `${personne.prenom[0]}${personne.nom[0]}`.toUpperCase();

  return (
    <div
      className="bg-white rounded-2xl border border-line p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* Header: avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: avatarColor }}
        >
          {initiales}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-base leading-snug">
            {personne.prenom} {personne.nom}
          </p>
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
            style={getRoleBadgeStyle(personne.role)}
          >
            {personne.role}
          </span>
        </div>
      </div>

      {/* Langues */}
      {personne.langues.length > 0 && (
        <p className="text-sm text-muted flex items-center gap-1 flex-wrap">
          <span>🗣️</span>
          {personne.langues.join(", ")}
        </p>
      )}

      {/* École + disponibilité */}
      <div className="flex flex-col gap-1">
        {personne.ecole_rattachee && (
          <p className="text-sm text-muted">📍 {personne.ecole_rattachee}</p>
        )}
        {personne.disponibilite && (
          <p className="text-sm text-muted">🕐 {personne.disponibilite}</p>
        )}
      </div>

      {/* Contexte recommandation */}
      {contexte && (
        <p className="text-sm text-muted italic border-l-2 border-line pl-2 leading-relaxed">
          &ldquo;{contexte}&rdquo;
        </p>
      )}

      {/* CTA */}
      {personne.accepte_contact_plateforme ? (
        <button
          onClick={() => parentId && onContact(personne)}
          disabled={!parentId}
          className="w-full flex items-center justify-center gap-1.5 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 disabled:opacity-40"
          style={{ background: "var(--color-primary)" }}
        >
          📨 Send a message
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          {personne.contact_externe?.telephone && (
            <a
              href={`tel:${personne.contact_externe.telephone}`}
              className="text-sm text-primary underline flex items-center gap-1"
            >
              📞 {personne.contact_externe.telephone}
            </a>
          )}
          {personne.contact_externe?.email && (
            <a
              href={`mailto:${personne.contact_externe.email}`}
              className="text-sm text-primary underline flex items-center gap-1"
            >
              ✉️ {personne.contact_externe.email}
            </a>
          )}
          {!personne.contact_externe?.telephone && !personne.contact_externe?.email && (
            <p className="text-sm text-muted text-center">External contact only</p>
          )}
        </div>
      )}
    </div>
  );
}
