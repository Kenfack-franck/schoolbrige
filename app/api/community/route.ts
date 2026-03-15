import { NextRequest, NextResponse } from "next/server";
import { getCommunityPosts, addCommunityPost } from "@/lib/store";
import { loadParents } from "@/lib/data";

// GET /api/community?parentId=PAR-001&filter=ecole|general
// parentId is optional when filter=general (returns ecole_cible=null posts)
export async function GET(req: NextRequest) {
  const parentId = req.nextUrl.searchParams.get("parentId");
  const filter = (req.nextUrl.searchParams.get("filter") ?? "ecole") as "ecole" | "general";

  if (!parentId && filter === "ecole") {
    return NextResponse.json({ error: "parentId required for ecole filter" }, { status: 400 });
  }

  // For general filter without parentId, use a pseudo parentId — getCommunityPosts
  // with filter="general" only uses schoolIds to exclude school-specific posts,
  // so we pass empty string which yields no school IDs → all general posts are returned.
  const effectiveParentId = parentId ?? "";
  const posts = getCommunityPosts(effectiveParentId, filter);
  return NextResponse.json({ posts });
}

// POST /api/community
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    parentId?: string;
    type?: string;
    titre?: string;
    contenu?: string;
    ecole_cible?: string | null;
  };
  const { parentId, type, titre, contenu, ecole_cible } = body;
  if (!parentId || !type || !titre || !contenu) {
    return NextResponse.json({ error: "parentId, type, titre, contenu required" }, { status: 400 });
  }

  const parents = loadParents();
  const parent = parents.find(p => p.id === parentId);
  if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

  const post = addCommunityPost({
    auteur_id: parentId,
    auteur_nom: `${parent.prenom} ${parent.nom}`,
    auteur_role: "Parent",
    auteur_ecole: null,
    type: type as "annonce_officielle" | "information" | "question" | "evenement",
    ecole_cible: ecole_cible ?? null,
    date: new Date().toISOString().slice(0, 10),
    titre,
    contenu,
    langue_originale: parent.langue_maternelle,
    epingle: false,
    tags: [],
    image: null,
    likes: 0,
    liked_by: [],
    comments: [],
  });

  return NextResponse.json({ post }, { status: 201 });
}
