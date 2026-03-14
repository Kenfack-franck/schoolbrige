import { NextRequest, NextResponse } from "next/server";
import type { Parent, Child } from "@/lib/data";
import { addParent, addChild } from "@/lib/store";

// ─── Request types ────────────────────────────────────────────────────────────

interface EnfantFormData {
  prenom: string;
  nom: string;
  age: number;
  type_ecole: string;
  nom_ecole: string;
  classe: string;
  resultats_scolaires: "Très bons" | "Bons" | "Moyens" | "En difficulté" | "Je ne sais pas";
}

interface RegisterRequest {
  prenom: string;
  nom: string;
  langue_maternelle: string;
  pays_origine: string;
  ville: string;
  en_allemagne_depuis: string;
  niveau_allemand: string;
  premier_enfant_en_allemagne: boolean;
  enfants: EnfantFormData[];
}

// Mapping "résultats scolaires" → moyenne approximative
const RESULTATS_TO_MOYENNE: Record<string, number | null> = {
  "Très bons": 1.5,
  "Bons": 2.5,
  "Moyens": 3.0,
  "En difficulté": 4.0,
  "Je ne sais pas": null,
};

// ─── POST /api/register ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterRequest;
    const ts = Date.now();

    // Build parent profile
    const parentId = `PAR-NEW-${ts}`;
    const enfantIds = body.enfants.map((_, i) => `ENF-NEW-${ts}-${i}`);

    const parent: Parent = {
      id: parentId,
      prenom: body.prenom,
      nom: body.nom,
      langue_maternelle: body.langue_maternelle,
      autres_langues: [],
      pays_origine: body.pays_origine,
      ville: body.ville,
      quartier: "",
      en_allemagne_depuis: body.en_allemagne_depuis,
      email: "",
      telephone: "",
      preference_communication: "texte",
      premier_enfant_en_allemagne: body.premier_enfant_en_allemagne,
      comprehension_systeme_scolaire: "pas du tout",
      niveau_allemand: body.niveau_allemand,
      est_buddy: false,
      enfants_ids: enfantIds,
    };

    // Build children profiles
    const enfants: Child[] = body.enfants.map((e, i) => ({
      id: enfantIds[i],
      prenom: e.prenom,
      nom: e.nom,
      age: e.age,
      parent_id: parentId,
      classe: e.classe,
      type_ecole: e.type_ecole,
      nom_ecole: e.nom_ecole || `${e.type_ecole} Heilbronn`,
      ecole_id: "",
      ville_ecole: body.ville,
      land: "Baden-Württemberg",
      moyenne_generale: RESULTATS_TO_MOYENNE[e.resultats_scolaires] ?? null,
      matieres_fortes: [],
      matieres_faibles: [],
      competence_dominante: "",
      besoins_particuliers: null,
      notes_recentes: {},
    }));

    // Persist in memory store
    addParent(parent);
    enfants.forEach(addChild);

    return NextResponse.json({
      parent,
      enfants,
      parentId,
      enfantIds,
    });
  } catch (error) {
    console.error("[/api/register] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription", details: String(error) },
      { status: 500 }
    );
  }
}
