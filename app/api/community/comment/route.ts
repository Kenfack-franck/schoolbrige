import { NextRequest, NextResponse } from "next/server";
import { addComment, getParentById } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { postId?: string; parentId?: string; contenu?: string };
    const { postId, parentId, contenu } = body;

    if (!postId || !parentId || !contenu?.trim()) {
      return NextResponse.json({ error: "postId, parentId and contenu required" }, { status: 400 });
    }

    const parent = getParentById(parentId);
    const auteurNom = parent ? `${parent.prenom} ${parent.nom}` : "Anonyme";

    const comment = addComment(postId, {
      auteur_id: parentId,
      auteur_nom: auteurNom,
      contenu: contenu.trim(),
      date: new Date().toISOString().slice(0, 10),
    });

    if (!comment) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
