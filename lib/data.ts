import fs from "fs";
import path from "path";
import {
  getAllParents,
  getAllChildren,
  getParentById,
  getChildById,
  getChildrenOfParent,
} from "./store";

const DATA_DIR = path.join(process.cwd(), "schoolbridge-data");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Parent {
  id: string;
  prenom: string;
  nom: string;
  langue_maternelle: string;
  autres_langues: string[];
  pays_origine: string;
  ville: string;
  quartier: string;
  en_allemagne_depuis: string;
  email: string;
  telephone: string;
  preference_communication: string;
  premier_enfant_en_allemagne: boolean;
  comprehension_systeme_scolaire: string;
  niveau_allemand: string;
  est_buddy: boolean;
  enfants_ids: string[];
}

export interface Child {
  id: string;
  prenom: string;
  nom: string;
  age: number;
  parent_id: string;
  classe: string;
  type_ecole: string;
  nom_ecole: string;
  ecole_id: string;
  ville_ecole: string;
  land: string;
  moyenne_generale: number | null;
  matieres_fortes: string[];
  matieres_faibles: string[];
  competence_dominante: string;
  besoins_particuliers: string | null;
  notes_recentes: Record<string, number>;
}

export interface PersonneRessource {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  aussi_parent_id?: string | null;
  langues: string[];
  ecole_rattachee?: string | null;
  zone: string;
  sujets_expertise: string[];
  accepte_contact_plateforme: boolean;
  accepte_demandes_info: boolean;
  disponibilite: string;
  description: string;
  contact_externe?: {
    adresse?: string;
    telephone?: string;
    email?: string;
  } | null;
}

export interface InventaireFichier {
  id: string;
  fichier: string;
  titre: string;
  contient: string;
}

export interface InventaireEcole {
  id: string;
  nom: string;
  type: string;
  fichiers_disponibles: InventaireFichier[];
}

export interface Inventaire {
  description: string;
  derniere_mise_a_jour: string;
  fichiers_connaissances: {
    national: InventaireFichier[];
    baden_wuerttemberg: InventaireFichier[];
  };
  donnees_ecoles: InventaireEcole[];
  donnees_dynamiques: {
    parents: { fichier: string; description: string; nombre: number; langues_representees: string[] };
    enfants: { fichier: string; description: string; nombre: number; ecoles_representees: string[]; niveaux_representes: string[] };
    personnes_ressources: { fichier: string; description: string; nombre: number; par_role: Record<string, string[]> };
  };
  informations_NON_disponibles: string[];
}

// ─── Loaders (via store — includes dynamically registered data) ───────────────

export function loadParents(): Parent[] {
  return getAllParents();
}

export function findParent(query: string): Parent | null {
  const parents = getAllParents();
  const q = query.toLowerCase().trim();
  return (
    parents.find(
      (p) =>
        p.prenom.toLowerCase().includes(q) ||
        p.nom.toLowerCase().includes(q) ||
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        p.id.toLowerCase() === q
    ) ?? null
  );
}

export function loadChildrenOf(parentId: string): Child[] {
  return getChildrenOfParent(parentId);
}

export function loadChild(childId: string): Child | null {
  return getChildById(childId);
}

export function loadAllChildren(): Child[] {
  return getAllChildren();
}

export function loadInventaire(): Inventaire {
  const fullPath = path.join(DATA_DIR, "inventaire.json");
  const raw = fs.readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as Inventaire;
}

/**
 * Charge le contenu brut d'un fichier de connaissance par son ID.
 */
export function loadKnowledgeFile(fileId: string): string | null {
  const inventaire = loadInventaire();

  const allFiles: InventaireFichier[] = [
    ...inventaire.fichiers_connaissances.national,
    ...inventaire.fichiers_connaissances.baden_wuerttemberg,
    ...inventaire.donnees_ecoles.flatMap((e) => e.fichiers_disponibles),
  ];

  const entry = allFiles.find((f) => f.id === fileId);
  if (!entry) return null;

  const fullPath = path.join(DATA_DIR, entry.fichier);
  if (!fs.existsSync(fullPath)) return null;

  const raw = fs.readFileSync(fullPath, "utf-8");

  if (entry.fichier.endsWith(".json")) {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  return raw;
}

export function loadPersonnesRessources(filters?: {
  langue?: string;
  zone?: string;
  role?: string;
}): PersonneRessource[] {
  const fullPath = path.join(DATA_DIR, "personnes_ressources/personnes_ressources.json");
  const raw = fs.readFileSync(fullPath, "utf-8");
  let personnes = JSON.parse(raw) as PersonneRessource[];

  if (filters?.langue) {
    const lang = filters.langue.toLowerCase();
    personnes = personnes.filter((pr) =>
      pr.langues.some((l) => l.toLowerCase().includes(lang))
    );
  }
  if (filters?.zone) {
    const zone = filters.zone.toLowerCase();
    personnes = personnes.filter((pr) =>
      pr.zone.toLowerCase().includes(zone)
    );
  }
  if (filters?.role) {
    const role = filters.role.toLowerCase();
    personnes = personnes.filter((pr) =>
      pr.role.toLowerCase().includes(role)
    );
  }

  return personnes;
}
