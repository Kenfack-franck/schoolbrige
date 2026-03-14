import { NextRequest, NextResponse } from "next/server";
import {
  getContacts,
  addContact,
  addContactMessage,
  type ContactItem,
} from "@/lib/store";

type RouteParams = { params: Promise<{ parentId: string }> };

// GET /api/contacts/[parentId]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { parentId } = await params;
  const contacts = getContacts(parentId);
  return NextResponse.json({ contacts });
}

// POST /api/contacts/[parentId]
// Body option 1: { personneRessourceId, nom, role, contexte } → add contact
// Body option 2: { contactId, message } → add message to existing contact
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { parentId } = await params;

  const body = (await req.json()) as Record<string, unknown>;

  // Add message to existing contact
  if (body.contactId && body.message) {
    const message = {
      date: new Date().toISOString(),
      texte: body.message as string,
    };
    addContactMessage(parentId, body.contactId as string, message);
    return NextResponse.json({ success: true, message });
  }

  // Add new contact
  if (body.personneRessourceId && body.nom) {
    const contact: ContactItem = {
      id: crypto.randomUUID(),
      parentId,
      personneRessourceId: body.personneRessourceId as string,
      nom: body.nom as string,
      role: (body.role as string) ?? "",
      date_ajout: new Date().toISOString(),
      contexte: (body.contexte as string) ?? "",
      messages: [],
    };
    addContact(parentId, contact);
    return NextResponse.json({ success: true, contact });
  }

  return NextResponse.json(
    { error: "Invalid body: provide (personneRessourceId, nom, role, contexte) or (contactId, message)" },
    { status: 400 }
  );
}
