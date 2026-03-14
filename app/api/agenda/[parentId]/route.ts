import { NextRequest, NextResponse } from "next/server";
import {
  getAgenda,
  setAgenda,
  addAgendaItems,
  markAgendaItemDone,
  prefillAgenda,
  type AgendaItem,
} from "@/lib/store";

type RouteParams = { params: Promise<{ parentId: string }> };

// GET /api/agenda/[parentId]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { parentId } = await params;

  let items = getAgenda(parentId);

  // Pre-fill if empty
  if (items.length === 0) {
    const prefilled = prefillAgenda(parentId);
    if (prefilled.length > 0) {
      setAgenda(parentId, prefilled);
      items = prefilled;
    }
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  const prochains = sorted.filter((item) => {
    const d = new Date(item.date);
    return d >= now && d <= in14Days;
  });

  const en_retard = sorted.filter((item) => {
    const d = new Date(item.date);
    return d < now && !item.fait && (item.type === "tache" || item.type === "echeance");
  });

  return NextResponse.json({
    evenements: sorted,
    prochains,
    en_retard,
  });
}

// POST /api/agenda/[parentId]
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { parentId } = await params;

  const body = (await req.json()) as {
    items: Omit<AgendaItem, "id" | "parentId">[];
  };

  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const newItems: AgendaItem[] = body.items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    parentId,
  }));

  addAgendaItems(parentId, newItems);

  return NextResponse.json({ added: newItems.length, items: newItems });
}

// PATCH /api/agenda/[parentId]
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { parentId } = await params;

  const body = (await req.json()) as { itemId: string; fait: boolean };

  if (!body.itemId || body.fait === undefined) {
    return NextResponse.json({ error: "itemId and fait required" }, { status: 400 });
  }

  markAgendaItemDone(parentId, body.itemId, body.fait);

  return NextResponse.json({ success: true });
}
