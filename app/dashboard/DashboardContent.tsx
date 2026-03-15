"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import ChildCard, { type Child } from "@/components/ChildCard";
import CalendarView, { type AgendaItem, TYPE_DOT_COLOR } from "@/components/CalendarView";
import AgendaListView from "@/components/AgendaListView";
import ContactCard, { type PersonneRessource } from "@/components/ContactCard";
import ContactModal from "@/components/ContactModal";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Parent {
  id: string;
  prenom: string;
  nom: string;
  langue_maternelle: string;
  pays_origine: string;
  ville: string;
  quartier: string;
  email: string;
  telephone: string;
  niveau_allemand: string;
  comprehension_systeme_scolaire: string;
  en_allemagne_depuis: string;
  premier_enfant_en_allemagne?: boolean;
}

interface AgendaResponse {
  evenements: AgendaItem[];
  prochains: AgendaItem[];
  en_retard: AgendaItem[];
}

interface ContactItem {
  id: string;
  parentId: string;
  personneRessourceId: string;
  nom: string;
  role: string;
  date_ajout: string;
  contexte: string;
  messages: Array<{ date: string; texte: string }>;
}

// ─── Section title component ───────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 mt-9 first:mt-0">
      <h2 className="font-display font-semibold text-xl text-foreground">{children}</h2>
      <div
        className="mt-2 rounded-full"
        style={{ width: "48px", height: "4px", background: "var(--color-accent)" }}
      />
    </div>
  );
}

// ─── Profile info row ─────────────────────────────────────────────────────────

function ProfileRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 text-base leading-snug">{icon}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

// ─── Hardcoded personnes ressources ───────────────────────────────────────────

const PERSONNES: PersonneRessource[] = [
  {
    id: "PR-001",
    prenom: "Fatma", nom: "Demir",
    role: "Parent Liaison (Buddy)",
    langues: ["Turkish", "Fluent German"],
    ecole_rattachee: "Friedrich-Schiller-Gymnasium",
    sujets_expertise: ["Gymnasium", "orientation", "communication with school"],
    accepte_contact_plateforme: true,
    disponibilite: "Flexible, prefers weekday evenings",
    description: "Experienced parent in Germany for 8 years. Very familiar with the school system.",
  },
  {
    id: "PR-002",
    prenom: "Olena", nom: "Kovalenko",
    role: "Parent Liaison (Buddy)",
    langues: ["Ukrainian", "Russian", "Intermediate German"],
    ecole_rattachee: "Grundschule Sontheim",
    sujets_expertise: ["Grundschule", "integration", "DaZ"],
    accepte_contact_plateforme: true,
    disponibilite: "Weekday evenings",
    description: "Arrived from Ukraine 2 years ago. Recent experience with school integration.",
  },
  {
    id: "PR-003",
    prenom: "Ahmad", nom: "Hassan",
    role: "Parent Liaison (Buddy)",
    langues: ["Arabic", "German"],
    sujets_expertise: ["Realschule", "financial support", "BuT"],
    accepte_contact_plateforme: true,
    disponibilite: "Wednesdays and weekends",
    description: "Expert in financial support (BuT). Parent of a student at Realschule.",
  },
  {
    id: "PR-004",
    prenom: "Ingrid", nom: "Weber",
    role: "Administration",
    ecole_rattachee: "Friedrich-Schiller-Gymnasium",
    langues: ["German"],
    sujets_expertise: ["enrollment", "documents", "administrative"],
    accepte_contact_plateforme: true,
    disponibilite: "Mon–Fri 8am–12pm and 2pm–4pm",
    description: "School secretary at FSG Heilbronn.",
  },
  {
    id: "PR-005",
    prenom: "Thomas", nom: "Müller",
    role: "Guidance Counsellor",
    ecole_rattachee: "Friedrich-Schiller-Gymnasium",
    langues: ["German", "English"],
    sujets_expertise: ["school guidance", "Gymnasium", "Abitur"],
    accepte_contact_plateforme: true,
    disponibilite: "By appointment",
    description: "Guidance Counsellor at Friedrich-Schiller-Gymnasium.",
  },
  {
    id: "PR-007",
    prenom: "Elif", nom: "Arslan",
    role: "Cultural Mediator",
    langues: ["Turkish", "German", "English"],
    sujets_expertise: ["mediation", "parental rights", "integration"],
    accepte_contact_plateforme: true,
    disponibilite: "Monday, Wednesday, Friday",
    description: "Cultural Mediator at Schulamt Heilbronn.",
  },
];

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModal, setContactModal] = useState<PersonneRessource | null>(null);

  // Agenda view toggle — list by default on mobile
  const [agendaView, setAgendaView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (!parentId) {
      setError("No parent ID provided.");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/parents/${parentId}`).then((r) => r.json()),
      fetch(`/api/agenda/${parentId}`).then((r) => r.json()),
      fetch(`/api/contacts/${parentId}`).then((r) => r.json()),
    ])
      .then(([parentData, agendaData, contactsData]) => {
        const pd = parentData as { parent?: Parent; enfants?: Child[] };
        if (pd.parent) setParent(pd.parent);
        if (pd.enfants) setChildren(pd.enfants);
        setAgenda(agendaData as AgendaResponse);
        const cd = contactsData as { contacts?: ContactItem[] };
        setContacts(cd.contacts ?? []);
      })
      .catch(() => setError("Error loading data."))
      .finally(() => setLoading(false));
  }, [parentId]);

  async function handleToggleDone(item: AgendaItem) {
    if (!parentId) return;
    await fetch(`/api/agenda/${parentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, fait: !item.fait }),
    });
    setAgenda((prev) => {
      if (!prev) return prev;
      const toggle = (items: AgendaItem[]) =>
        items.map((i) => (i.id === item.id ? { ...i, fait: !i.fait } : i));
      return {
        evenements: toggle(prev.evenements),
        prochains: toggle(prev.prochains),
        en_retard: toggle(prev.en_retard),
      };
    });
  }

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex flex-col">
        <NavBar parentId={parentId} activePage="dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-primary-lighter"
              style={{ borderTopColor: "var(--color-primary)", animation: "spin 0.8s linear infinite" }}
            />
            <p className="text-muted text-sm">Loading dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="min-h-screen bg-canvas-soft flex flex-col">
        <NavBar parentId={parentId} activePage="dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger mb-4">{error ?? "Parent not found"}</p>
            <Link href="/" className="text-primary underline text-sm">← Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const allEvents = agenda?.evenements ?? [];

  // Contacts: merge personne ressources (prioritize those who've been contacted)
  const contactedIds = new Set(contacts.map((c) => c.personneRessourceId));
  const personnesWithContext = PERSONNES.map((p) => {
    const c = contacts.find((c) => c.personneRessourceId === p.id);
    return { personne: p, contexte: c?.contexte };
  });

  return (
    <div className="min-h-screen bg-canvas-soft pb-20 md:pb-0">
      {/* Contact modal */}
      {contactModal && parentId && (
        <ContactModal
          personneId={contactModal.id}
          nom={`${contactModal.prenom} ${contactModal.nom}`}
          role={contactModal.role}
          disponibilite={contactModal.disponibilite}
          description={contactModal.description}
          parentId={parentId}
          onClose={() => setContactModal(null)}
          onSuccess={() => setTimeout(() => setContactModal(null), 1800)}
        />
      )}

      {/* NavBar */}
      <NavBar parentId={parentId} activePage="dashboard" />

      {/* Dashboard header */}
      <div className="bg-white border-b border-line px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">
              Hello, {parent.prenom} 👋
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {parent.ville}{parent.quartier ? `, ${parent.quartier}` : ""} · {parent.langue_maternelle}
            </p>
          </div>
          <p className="hidden md:block text-sm text-muted capitalize">{monthLabel}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── A. MES ENFANTS ─────────────────────────────────────────────────── */}
        <SectionTitle>My children</SectionTitle>

        {children.length === 0 ? (
          <p className="text-muted text-sm">No children registered.</p>
        ) : (
          /* Mobile: horizontal carousel; desktop: 2-col grid */
          <div
            className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {children.map((child, idx) => (
              <div
                key={child.id}
                className="shrink-0 md:shrink w-72 md:w-auto"
                style={{ scrollSnapAlign: "start" }}
              >
                <ChildCard child={child} colorIndex={idx} />
              </div>
            ))}
          </div>
        )}

        {/* ── B. AGENDA ──────────────────────────────────────────────────────── */}
        <SectionTitle>Agenda</SectionTitle>

        {/* View toggle */}
        <div className="flex items-center gap-1 mb-4 bg-white border border-line rounded-xl p-1 self-start w-fit" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <button
            onClick={() => setAgendaView("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              agendaView === "calendar"
                ? "text-white"
                : "text-muted hover:bg-canvas-muted"
            }`}
            style={agendaView === "calendar" ? { background: "var(--color-primary)" } : {}}
          >
            📅 Calendar
          </button>
          <button
            onClick={() => setAgendaView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              agendaView === "list"
                ? "text-white"
                : "text-muted hover:bg-canvas-muted"
            }`}
            style={agendaView === "list" ? { background: "var(--color-primary)" } : {}}
          >
            📋 List
          </button>
        </div>

        {agendaView === "calendar" ? (
          /* Desktop: calendar (left 60%) + prochainement (right 40%) */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <CalendarView events={allEvents} />
            </div>

            {/* Prochainement sidebar */}
            <div className="lg:col-span-2">
              <div
                className="bg-white rounded-2xl border border-line p-4 flex flex-col gap-3"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <h3 className="font-display font-semibold text-sm text-foreground">Upcoming</h3>
                {agenda?.prochains && agenda.prochains.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {agenda.prochains.slice(0, 6).map((item) => {
                      const d = new Date(item.date + "T00:00:00");
                      const dateLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      return (
                        <div key={item.id} className="flex items-start gap-2 py-2 border-b border-line last:border-0">
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                            style={{ background: TYPE_DOT_COLOR[item.type] }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground leading-snug truncate">
                              {item.titre}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5">
                              {dateLabel}{item.heure ? ` · ${item.heure}` : ""}
                              {item.enfant_concerne ? ` · ${item.enfant_concerne}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No events in the next 14 days.</p>
                )}
                {agenda?.en_retard && agenda.en_retard.length > 0 && (
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-semibold text-red-700">
                      ⚠️ {agenda.en_retard.length} overdue task{agenda.en_retard.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Switch to List view to manage.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AgendaListView events={allEvents} onToggleDone={handleToggleDone} />
        )}

        {/* ── C. MES CONTACTS ────────────────────────────────────────────────── */}
        <SectionTitle>My contacts</SectionTitle>

        {personnesWithContext.length === 0 ? (
          <div className="bg-white rounded-2xl border border-line p-6 text-center" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
            <p className="text-muted text-sm mb-3">
              Your contacts will appear here as you have conversations with SchoolBridge.
            </p>
            <Link
              href={parentId ? `/community?parentId=${parentId}` : "/community"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors"
              style={{ background: "var(--color-primary)" }}
            >
              👥 View community
            </Link>
          </div>
        ) : (
          <>
            {/* Highlight contacted ones first */}
            {contactedIds.size > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  My contacts ({contactedIds.size})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personnesWithContext
                    .filter(({ personne }) => contactedIds.has(personne.id))
                    .map(({ personne, contexte }) => (
                      <ContactCard
                        key={personne.id}
                        personne={personne}
                        contexte={contexte}
                        parentId={parentId}
                        onContact={setContactModal}
                      />
                    ))}
                </div>
              </div>
            )}

            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Available people
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {personnesWithContext
                .filter(({ personne }) => !contactedIds.has(personne.id))
                .map(({ personne }) => (
                  <ContactCard
                    key={personne.id}
                    personne={personne}
                    parentId={parentId}
                    onContact={setContactModal}
                  />
                ))}
            </div>
          </>
        )}

        {/* ── D. MON PROFIL ──────────────────────────────────────────────────── */}
        <SectionTitle>My profile</SectionTitle>

        <div
          className="rounded-2xl border border-line p-5 flex flex-col gap-2.5"
          style={{ background: "var(--color-canvas-muted)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <p className="font-display font-semibold text-foreground text-base">
            {parent.prenom} {parent.nom}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ProfileRow icon="🌍">
              {parent.langue_maternelle} · {parent.pays_origine}
            </ProfileRow>
            <ProfileRow icon="📍">
              {parent.ville}{parent.quartier ? `, ${parent.quartier}` : ""}
            </ProfileRow>
            <ProfileRow icon="🇩🇪">
              In Germany since {parent.en_allemagne_depuis}
            </ProfileRow>
            <ProfileRow icon="📖">
              German level: {parent.niveau_allemand}
            </ProfileRow>
            {parent.premier_enfant_en_allemagne && (
              <ProfileRow icon="👶">
                First child enrolled in school in Germany
              </ProfileRow>
            )}
            <ProfileRow icon="🧭">
              System understanding: {parent.comprehension_systeme_scolaire}
            </ProfileRow>
            <ProfileRow icon="✉️">{parent.email}</ProfileRow>
            <ProfileRow icon="📞">{parent.telephone}</ProfileRow>
          </div>
        </div>

      </div>
    </div>
  );
}
