"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
}

interface Child {
  id: string;
  prenom: string;
  nom: string;
  age: number;
  classe: string;
  type_ecole: string;
  nom_ecole: string;
  ecole_id: string;
  moyenne_generale: number | null;
  matieres_fortes: string[];
  matieres_faibles: string[];
  competence_dominante: string;
  notes_recentes: Record<string, number>;
  besoins_particuliers: string | null;
}

interface AgendaItem {
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

interface PersonneRessource {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  langues: string[];
  sujets_expertise: string[];
  accepte_contact_plateforme: boolean;
  disponibilite: string;
  description: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getMoyenneColor(moyenne: number | null): { bg: string; text: string; label: string } {
  if (moyenne === null) return { bg: "bg-slate-100", text: "text-slate-500", label: "Pas encore évalué" };
  if (moyenne <= 2.0) return { bg: "bg-green-100", text: "text-green-700", label: "Très bons résultats" };
  if (moyenne <= 3.0) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Bons résultats" };
  if (moyenne <= 4.0) return { bg: "bg-orange-100", text: "text-orange-700", label: "Résultats moyens" };
  return { bg: "bg-red-100", text: "text-red-700", label: "En difficulté" };
}

function getNoteColor(note: number): string {
  if (note <= 2) return "text-green-700";
  if (note === 3) return "text-yellow-700";
  if (note === 4) return "text-orange-700";
  return "text-red-700";
}

function getTypeIcon(type: AgendaItem["type"]): string {
  const icons: Record<AgendaItem["type"], string> = {
    reunion: "📋",
    examen: "📝",
    echeance: "⏰",
    tache: "✅",
    vacances: "🏖️",
    evenement: "🎉",
    bulletin: "📊",
  };
  return icons[type] ?? "📅";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function isInNext7Days(dateStr: string): boolean {
  const now = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr + "T00:00:00") < new Date();
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  const [parent, setParent] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [personnes, setPersonnes] = useState<PersonneRessource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModal, setContactModal] = useState<PersonneRessource | null>(null);

  useEffect(() => {
    if (!parentId) {
      setError("Aucun identifiant parent fourni.");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/parents/${parentId}`).then((r) => r.json()),
      fetch(`/api/agenda/${parentId}`).then((r) => r.json()),
      fetch(`/api/contacts/${parentId}`).then((r) => r.json()),
      fetch("/api/parents").then((r) => r.json()),
    ])
      .then(([parentData, agendaData, contactsData, allParentsData]) => {
        const pd = parentData as { parent?: Parent; enfants?: Child[] };
        if (pd.parent) setParent(pd.parent);
        if (pd.enfants) setChildren(pd.enfants);

        setAgenda(agendaData as AgendaResponse);
        const cd = contactsData as { contacts?: ContactItem[] };
        setContacts(cd.contacts ?? []);

        // Extract personnes ressources from parents data (those with roles)
        // We'll fetch them via a separate endpoint if available, else use static data
        // For now, try to load via the parents endpoint personnes context
        void allParentsData; // used later if needed

        // Fetch personnes ressources
        fetch("/api/parents")
          .then(() => {
            // The parents API doesn't expose personnes ressources directly
            // We'll create a simple list from what we know
          })
          .catch(() => {});
      })
      .catch(() => {
        setError("Erreur lors du chargement des données.");
      })
      .finally(() => setLoading(false));
  }, [parentId]);

  // Fetch personnes ressources
  useEffect(() => {
    // We can read from /api/parents/[id] or build a custom endpoint
    // For now, use hardcoded data from inventaire knowledge
    const hardcodedPersonnes: PersonneRessource[] = [
      {
        id: "PR-001",
        prenom: "Fatma",
        nom: "Demir",
        role: "Parent-relais (Buddy)",
        langues: ["Turc", "Allemand"],
        sujets_expertise: ["Gymnasium", "orientation", "vie scolaire"],
        accepte_contact_plateforme: true,
        disponibilite: "Week-ends, soirs après 18h",
        description: "Parent d'un élève au Friedrich-Schiller-Gymnasium. Peut aider en turc et allemand.",
      },
      {
        id: "PR-002",
        prenom: "Olena",
        nom: "Kovalenko",
        role: "Parent-relais (Buddy)",
        langues: ["Ukrainien", "Allemand", "Anglais"],
        sujets_expertise: ["Grundschule", "inscription", "soutien scolaire"],
        accepte_contact_plateforme: true,
        disponibilite: "Lundi-Vendredi 9h-12h",
        description: "Parent d'élèves en Grundschule. Parle ukrainien, allemand et anglais.",
      },
      {
        id: "PR-003",
        prenom: "Ahmad",
        nom: "Hassan",
        role: "Parent-relais (Buddy)",
        langues: ["Arabe", "Allemand"],
        sujets_expertise: ["Realschule", "aides financières", "BuT"],
        accepte_contact_plateforme: true,
        disponibilite: "Mercredi et week-ends",
        description: "Parent d'un élève en Realschule. Expert en aides financières (BuT).",
      },
      {
        id: "PR-004",
        prenom: "Ingrid",
        nom: "Weber",
        role: "Secrétariat",
        langues: ["Allemand"],
        sujets_expertise: ["inscription", "documents", "administratif"],
        accepte_contact_plateforme: true,
        disponibilite: "Lundi-Vendredi 8h-12h et 14h-16h",
        description: "Secrétaire du Friedrich-Schiller-Gymnasium Heilbronn.",
      },
      {
        id: "PR-005",
        prenom: "Thomas",
        nom: "Müller",
        role: "Conseiller d'orientation",
        langues: ["Allemand", "Anglais"],
        sujets_expertise: ["orientation scolaire", "Gymnasium", "Oberstufe", "Abitur"],
        accepte_contact_plateforme: true,
        disponibilite: "Sur rendez-vous",
        description: "Conseiller d'orientation au Friedrich-Schiller-Gymnasium.",
      },
      {
        id: "PR-007",
        prenom: "Elif",
        nom: "Arslan",
        role: "Médiatrice interculturelle",
        langues: ["Turc", "Allemand", "Anglais"],
        sujets_expertise: ["médiation", "droits des parents", "intégration"],
        accepte_contact_plateforme: true,
        disponibilite: "Lundi, Mercredi, Vendredi",
        description: "Médiatrice interculturelle au Schulamt Heilbronn. Aide les familles immigrées.",
      },
    ];
    setPersonnes(hardcodedPersonnes);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Chargement du dashboard...
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error ?? "Parent introuvable"}</p>
          <Link href="/" className="text-blue-600 underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
          onSuccess={() => setTimeout(() => setContactModal(null), 2000)}
        />
      )}

      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-blue-200 text-sm font-medium">
            ← Accueil
          </Link>
          <div>
            <h1 className="text-xl font-bold">SchoolBridge — Dashboard de {parent.prenom}</h1>
            <p className="text-xs text-blue-200">{parent.ville} · {parent.langue_maternelle}</p>
          </div>
        </div>
        <Link
          href={`/chat?parentId=${parentId}`}
          className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
        >
          💬 Chat
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── A. Mes Enfants ─────────────────────────────────────────────────── */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Mes Enfants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {children.map((child) => {
              const mc = getMoyenneColor(child.moyenne_generale);
              return (
                <div key={child.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{child.prenom} {child.nom}</h3>
                      <p className="text-sm text-slate-500">{child.age} ans · {child.classe}</p>
                      <p className="text-xs text-slate-400">{child.type_ecole} — {child.nom_ecole}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${mc.bg} ${mc.text}`}>
                      {child.moyenne_generale !== null ? `${child.moyenne_generale}/6` : "—"}
                    </span>
                  </div>

                  <div className={`text-xs font-medium px-3 py-1.5 rounded-lg ${mc.bg} ${mc.text} mb-3`}>
                    {mc.label}
                  </div>

                  {child.competence_dominante && (
                    <div className="mb-3">
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        ⭐ {child.competence_dominante}
                      </span>
                    </div>
                  )}

                  {child.matieres_fortes.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Points forts</p>
                      <div className="flex flex-wrap gap-1">
                        {child.matieres_fortes.map((m) => (
                          <span key={m} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {child.matieres_faibles.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">À renforcer</p>
                      <div className="flex flex-wrap gap-1">
                        {child.matieres_faibles.map((m) => (
                          <span key={m} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(child.notes_recentes).length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-2">
                      <p className="text-xs text-slate-500 mb-1">Notes récentes</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(child.notes_recentes).map(([matiere, note]) => (
                          <span key={matiere} className={`text-xs font-semibold ${getNoteColor(note)}`}>
                            {matiere}: {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {child.besoins_particuliers && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                      ⚠️ {child.besoins_particuliers}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── B. Agenda ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Agenda</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {!agenda || agenda.evenements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Aucun événement dans l&apos;agenda.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {agenda.evenements.map((item) => {
                  const inNext7 = isInNext7Days(item.date);
                  const past = isPast(item.date);
                  const isOverdue = past && !item.fait && (item.type === "tache" || item.type === "echeance");

                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                        isOverdue
                          ? "bg-red-50"
                          : inNext7
                          ? "bg-blue-50 border-l-4 border-blue-400"
                          : item.fait
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{getTypeIcon(item.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.fait ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {item.titre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(item.date)}{item.heure ? ` à ${item.heure}` : ""}
                          {item.enfant_concerne ? ` · ${item.enfant_concerne}` : ""}
                        </p>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                        )}
                        {isOverdue && (
                          <span className="text-xs text-red-600 font-medium">En retard</span>
                        )}
                      </div>
                      {(item.type === "tache" || item.type === "echeance") && (
                        <button
                          onClick={() => handleToggleDone(item)}
                          className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.fait
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-slate-300 hover:border-green-400"
                          }`}
                          title={item.fait ? "Marquer comme non fait" : "Marquer comme fait"}
                        >
                          {item.fait && "✓"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── C. Contacts ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Contacts & Personnes-ressources</h2>

          {contacts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Mes contacts</h3>
              <div className="flex flex-col gap-2">
                {contacts.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{c.nom}</p>
                        <p className="text-xs text-slate-500">{c.role}</p>
                      </div>
                      <span className="text-xs text-slate-400">{c.messages.length} message{c.messages.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Personnes disponibles</h3>
            <div className="flex flex-col gap-2">
              {personnes.filter(p => p.accepte_contact_plateforme).map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-slate-500">{p.role}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.langues.map((l) => (
                          <span key={l} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setContactModal(p)}
                      className="shrink-0 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Contacter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── D. Mon Profil ──────────────────────────────────────────────────── */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Mon Profil</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nom complet</p>
                <p className="text-slate-800 font-medium">{parent.prenom} {parent.nom}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Langue maternelle</p>
                <p className="text-slate-800">{parent.langue_maternelle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pays d&apos;origine</p>
                <p className="text-slate-800">{parent.pays_origine}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ville</p>
                <p className="text-slate-800">{parent.ville}{parent.quartier ? ` — ${parent.quartier}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">En Allemagne depuis</p>
                <p className="text-slate-800">{parent.en_allemagne_depuis}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Niveau d&apos;allemand</p>
                <p className="text-slate-800">{parent.niveau_allemand}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-slate-800 text-sm">{parent.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Téléphone</p>
                <p className="text-slate-800">{parent.telephone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Connaissance du système</p>
                <p className="text-slate-800">{parent.comprehension_systeme_scolaire}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
