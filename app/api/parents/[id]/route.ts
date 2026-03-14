import { NextRequest, NextResponse } from "next/server";
import { loadParents, loadChildrenOf } from "@/lib/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parents = loadParents();
    const parent = parents.find((p) => p.id === id);

    if (!parent) {
      return NextResponse.json({ error: "Parent introuvable" }, { status: 404 });
    }

    const enfants = loadChildrenOf(parent.id);

    return NextResponse.json({ parent, enfants });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur chargement du parent", details: String(error) },
      { status: 500 }
    );
  }
}
