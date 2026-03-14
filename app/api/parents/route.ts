import { NextResponse } from "next/server";
import { loadParents, loadChildrenOf } from "@/lib/data";

export async function GET() {
  try {
    const parents = loadParents();
    const result = parents.map((p) => {
      const enfants = loadChildrenOf(p.id);
      return {
        id: p.id,
        prenom: p.prenom,
        nom: p.nom,
        langue_maternelle: p.langue_maternelle,
        pays_origine: p.pays_origine,
        nombre_enfants: enfants.length,
        enfants_prenoms: enfants.map((e) => e.prenom),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur chargement des parents", details: String(error) },
      { status: 500 }
    );
  }
}
