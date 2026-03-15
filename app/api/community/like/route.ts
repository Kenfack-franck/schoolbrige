import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { postId?: string; parentId?: string };
    const { postId, parentId } = body;

    if (!postId || !parentId) {
      return NextResponse.json({ error: "postId and parentId required" }, { status: 400 });
    }

    const result = toggleLike(postId, parentId);
    if (!result) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
