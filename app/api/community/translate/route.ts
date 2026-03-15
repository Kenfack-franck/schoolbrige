import { NextRequest, NextResponse } from "next/server";
import { getCommunityPostById } from "@/lib/store";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { postId, targetLang } = await req.json() as { postId?: string; targetLang?: string };
  if (!postId || !targetLang) {
    return NextResponse.json({ error: "postId and targetLang required" }, { status: 400 });
  }

  const post = getCommunityPostById(postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Traduis le texte suivant en ${targetLang}. Garde le même ton : si c'est une annonce officielle, reste formel ; si c'est un message de parent, reste naturel et chaleureux. Ne traduis pas les noms propres, les noms d'écoles, les adresses ou les URLs. Retourne UNIQUEMENT le texte traduit, rien d'autre.\n\n${post.contenu}`;

  const result = await model.generateContent(prompt);
  const traduit = result.response.text().trim();

  return NextResponse.json({
    postId,
    original: post.contenu,
    traduit,
    langue_source: post.langue_originale,
    langue_cible: targetLang,
  });
}
