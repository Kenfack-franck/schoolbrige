/**
 * In-memory store — chargé au démarrage depuis les JSON statiques,
 * enrichi par les inscriptions via /api/register.
 * Les données sont perdues au redémarrage du serveur (MVP).
 */

import fs from "fs";
import path from "path";
import type { Parent, Child } from "./data";

const DATA_DIR = path.join(process.cwd(), "schoolbridge-data");

function readJsonFile<T>(relativePath: string): T {
  const raw = fs.readFileSync(path.join(DATA_DIR, relativePath), "utf-8");
  return JSON.parse(raw) as T;
}

// ─── Store singleton ──────────────────────────────────────────────────────────

let _parents: Parent[] | null = null;
let _children: Child[] | null = null;

function ensureLoaded() {
  if (!_parents) {
    _parents = readJsonFile<Parent[]>("parents/parents.json");
  }
  if (!_children) {
    _children = readJsonFile<Child[]>("enfants/enfants.json");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAllParents(): Parent[] {
  ensureLoaded();
  return _parents!;
}

export function getAllChildren(): Child[] {
  ensureLoaded();
  return _children!;
}

export function getParentById(id: string): Parent | null {
  ensureLoaded();
  return _parents!.find((p) => p.id === id) ?? null;
}

export function getChildById(id: string): Child | null {
  ensureLoaded();
  return _children!.find((c) => c.id === id) ?? null;
}

export function getChildrenOfParent(parentId: string): Child[] {
  ensureLoaded();
  return _children!.filter((c) => c.parent_id === parentId);
}

export function addParent(parent: Parent): void {
  ensureLoaded();
  _parents!.push(parent);
}

export function addChild(child: Child): void {
  ensureLoaded();
  _children!.push(child);
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  parentId: string;
  titre: string;
  date: string; // YYYY-MM-DD
  heure: string | null;
  lieu: string | null;
  enfant_concerne: string | null;
  type: "reunion" | "examen" | "echeance" | "tache" | "vacances" | "evenement" | "bulletin";
  source: "calendrier_ecole" | "calendrier_land" | "agent" | "parent";
  description: string;
  fait: boolean;
}

export interface ContactItem {
  id: string;
  parentId: string;
  personneRessourceId: string;
  nom: string;
  role: string;
  date_ajout: string; // ISO date
  contexte: string;
  messages: Array<{ date: string; texte: string }>;
}

const _agendas = new Map<string, AgendaItem[]>(); // key = parentId
const _contacts = new Map<string, ContactItem[]>(); // key = parentId

export function getAgenda(parentId: string): AgendaItem[] {
  return _agendas.get(parentId) ?? [];
}

export function setAgenda(parentId: string, items: AgendaItem[]): void {
  _agendas.set(parentId, items);
}

export function addAgendaItems(parentId: string, items: AgendaItem[]): void {
  const existing = _agendas.get(parentId) ?? [];
  _agendas.set(parentId, [...existing, ...items]);
}

export function markAgendaItemDone(parentId: string, itemId: string, fait: boolean): void {
  const items = _agendas.get(parentId) ?? [];
  _agendas.set(parentId, items.map(i => i.id === itemId ? { ...i, fait } : i));
}

export function getContacts(parentId: string): ContactItem[] {
  return _contacts.get(parentId) ?? [];
}

export function addContact(parentId: string, contact: ContactItem): void {
  const existing = _contacts.get(parentId) ?? [];
  // avoid duplicate by personneRessourceId
  if (!existing.find(c => c.personneRessourceId === contact.personneRessourceId)) {
    _contacts.set(parentId, [...existing, contact]);
  }
}

export function addContactMessage(parentId: string, contactId: string, message: { date: string; texte: string }): void {
  const contacts = _contacts.get(parentId) ?? [];
  _contacts.set(parentId, contacts.map(c =>
    c.id === contactId ? { ...c, messages: [...c.messages, message] } : c
  ));
}

// ─── Agenda pre-population ────────────────────────────────────────────────────

/**
 * Pre-fills agenda from BW school calendar and school-specific calendars.
 * Hardcoded BW vacation dates from calendrier_2025_2026.md.
 */
export function prefillAgenda(parentId: string): AgendaItem[] {
  ensureLoaded();
  const children = _children!.filter(c => c.parent_id === parentId);
  const items: AgendaItem[] = [];

  // BW vacation dates (from calendrier_2025_2026.md)
  const bwVacances: Array<{ titre: string; date: string; description: string }> = [
    { titre: "Vacances d'automne (Herbstferien)", date: "2025-10-27", description: "Vacances d'automne — 27 octobre au 31 octobre 2025" },
    { titre: "Vacances de Noël (Weihnachtsferien)", date: "2025-12-22", description: "Vacances de Noël — 22 décembre 2025 au 6 janvier 2026" },
    { titre: "Vacances de Carnaval (Faschingsferien)", date: "2026-02-16", description: "Vacances de Carnaval — 16 au 20 février 2026" },
    { titre: "Vacances de Pâques (Osterferien)", date: "2026-03-30", description: "Vacances de Pâques — 30 mars au 10 avril 2026" },
    { titre: "Vacances de Pentecôte (Pfingstferien)", date: "2026-05-26", description: "Vacances de Pentecôte — 26 mai au 6 juin 2026" },
    { titre: "Vacances d'été (Sommerferien)", date: "2026-07-27", description: "Vacances d'été — 27 juillet au 7 septembre 2026" },
  ];

  for (const v of bwVacances) {
    items.push({
      id: crypto.randomUUID(),
      parentId,
      titre: v.titre,
      date: v.date,
      heure: null,
      lieu: null,
      enfant_concerne: null,
      type: "vacances",
      source: "calendrier_land",
      description: v.description,
      fait: false,
    });
  }

  // School-specific calendar for Friedrich-Schiller-Gymnasium
  const fsgCalendarPath = path.join(DATA_DIR, "ecoles/friedrich_schiller_gymnasium_heilbronn/calendrier.json");
  if (fs.existsSync(fsgCalendarPath)) {
    try {
      interface CalendrierJSON {
        elternabende?: Array<{ date: string; heure?: string; classes?: string; lieu?: string; description?: string }>;
        examens?: Array<{ periode?: string; type?: string; classes?: string; description?: string }>;
        bulletins?: Array<{ date: string; type?: string; description?: string }>;
        evenements?: Array<{ date: string; nom?: string; description?: string; debut?: string; fin?: string }>;
      }
      const cal = JSON.parse(fs.readFileSync(fsgCalendarPath, "utf-8")) as CalendrierJSON;

      // Only add events if one of the children attends this school
      const hasFsgChild = children.some(c => c.ecole_id === "ECOLE-FSG");
      if (hasFsgChild) {
        // Find children at FSG
        const fsgChildren = children.filter(c => c.ecole_id === "ECOLE-FSG");

        // Elternabende
        if (cal.elternabende) {
          for (const e of cal.elternabende) {
            // Check if any child is in the relevant class range
            const relevantChild = fsgChildren.find(child => {
              const classeNum = parseInt(child.classe.replace("Klasse ", ""));
              const classesStr = e.classes ?? "";
              if (classesStr.includes("-")) {
                const parts = classesStr.match(/(\d+)-(\d+)/);
                if (parts) {
                  return classeNum >= parseInt(parts[1]) && classeNum <= parseInt(parts[2]);
                }
              }
              return classesStr.includes(child.classe);
            });
            if (relevantChild) {
              items.push({
                id: crypto.randomUUID(),
                parentId,
                titre: `Elternabend ${e.classes ?? ""}`,
                date: e.date,
                heure: e.heure ?? null,
                lieu: e.lieu ?? "Aula",
                enfant_concerne: relevantChild.prenom,
                type: "reunion",
                source: "calendrier_ecole",
                description: e.description ?? "",
                fait: false,
              });
            }
          }
        }

        // Bulletins
        if (cal.bulletins) {
          for (const b of cal.bulletins) {
            for (const child of fsgChildren) {
              items.push({
                id: crypto.randomUUID(),
                parentId,
                titre: `${b.type ?? "Bulletin"} — ${child.prenom}`,
                date: b.date,
                heure: null,
                lieu: null,
                enfant_concerne: child.prenom,
                type: "bulletin",
                source: "calendrier_ecole",
                description: b.description ?? "",
                fait: false,
              });
            }
          }
        }

        // Evenements
        if (cal.evenements) {
          for (const ev of cal.evenements) {
            items.push({
              id: crypto.randomUUID(),
              parentId,
              titre: ev.nom ?? "Événement",
              date: ev.date,
              heure: null,
              lieu: null,
              enfant_concerne: null,
              type: "evenement",
              source: "calendrier_ecole",
              description: ev.description ?? "",
              fait: false,
            });
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return items;
}
