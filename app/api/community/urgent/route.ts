import { NextRequest, NextResponse } from "next/server";
import { getUrgentPosts } from "@/lib/store";

export async function GET(req: NextRequest) {
  const parentId = req.nextUrl.searchParams.get("parentId");
  if (!parentId) return NextResponse.json({ error: "parentId required" }, { status: 400 });

  const posts = getUrgentPosts(parentId);
  const urgent_posts = posts.map(p => ({
    id: p.id,
    auteur_nom: p.auteur_nom,
    auteur_role: p.auteur_role,
    titre: p.titre,
    date: p.date,
    contenu_court: p.contenu.slice(0, 100),
    epingle: p.epingle,
  }));

  return NextResponse.json({ urgent_posts });
}
