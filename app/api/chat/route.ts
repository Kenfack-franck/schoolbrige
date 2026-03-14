import { NextRequest } from "next/server";
import { chat, type ChatMessage } from "@/lib/gemini";
import {
  loadParents,
  loadChildrenOf,
  loadInventaire,
  loadPersonnesRessources,
  loadKnowledgeFile,
  type PersonneRessource,
} from "@/lib/data";
import {
  SCHOOLBRIDGE_SYSTEM_PROMPT,
  buildContextPrompt,
  buildAnonymousPrompt,
} from "@/lib/prompts";
import { addAgendaItems, type AgendaItem } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatRequest {
  message: string;
  parentId: string | null;
  history: ChatMessage[];
}

interface GeminiNeedFiles {
  status: "need_files";
  requested_files: string[];
  message_parent: string;
}

interface GeminiComplete {
  status: "complete";
  response: string;
  sources: string[];
  agenda_items?: Array<{
    titre: string;
    date: string;
    heure: string | null;
    type: string;
    enfant_concerne: string | null;
    description: string;
  }>;
  recommended_contacts?: string[]; // array of PersonneRessource IDs
}

type GeminiResponse = GeminiNeedFiles | GeminiComplete;

// ─── SSE helpers ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(type: string, data: object): Uint8Array {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamWords(
  text: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const tokens = text.match(/\S+\s*/g) ?? [];
  const delay = tokens.length > 250 ? 7 : tokens.length > 120 ? 11 : 16;
  for (const token of tokens) {
    controller.enqueue(sseEvent("token", { content: token }));
    await sleep(delay);
  }
}

// ─── POST /api/chat — SSE ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;
  const { message, parentId, history } = body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(sseEvent("status", { type: "thinking" }));

        const inventaire = loadInventaire();
        const personnes = loadPersonnesRessources();

        // ── Chemin 3 : chat anonyme ──────────────────────────────────────────
        if (!parentId) {
          const systemPrompt = buildAnonymousPrompt(inventaire, personnes);
          const messages: ChatMessage[] = [
            ...history,
            { role: "user", content: message },
          ];

          const firstResponse = (await chat(systemPrompt, messages)) as GeminiResponse;

          let responseText: string;
          let sources: string[];

          if (firstResponse.status === "need_files") {
            controller.enqueue(
              sseEvent("status", {
                type: "searching",
                message: firstResponse.message_parent,
              })
            );
            const fileContents = loadFilesContent(firstResponse.requested_files);
            const second = (await chat(systemPrompt, [
              ...messages,
              { role: "assistant", content: JSON.stringify(firstResponse) },
              {
                role: "user",
                content: `Voici le contenu des fichiers que tu as demandés :\n\n${fileContents}\n\nMaintenant, formule ta réponse complète.`,
              },
            ])) as GeminiComplete;
            responseText = second.response ?? "Désolé, je n'ai pas pu formuler une réponse.";
            sources = second.sources ?? firstResponse.requested_files;
          } else {
            responseText = firstResponse.response;
            sources = firstResponse.sources ?? [];
          }

          await streamWords(responseText, controller);
          controller.enqueue(sseEvent("done", { sources, full_response: responseText }));
          controller.close();
          return;
        }

        // ── Chemins 1 & 2 : parent identifié ─────────────────────────────────


        const parents = loadParents();
        const parent = parents.find((p) => p.id === parentId);

        if (!parent) {
          controller.enqueue(
            sseEvent("status", { type: "error", message: "Parent introuvable." })
          );
          controller.close();
          return;
        }

        // Charger TOUS les enfants du parent
        const children = loadChildrenOf(parentId);

        const contextPrompt = buildContextPrompt(parent, children, inventaire, personnes);
        const fullSystemPrompt = `${SCHOOLBRIDGE_SYSTEM_PROMPT}\n\n${contextPrompt}`;

        const firstCallMessages: ChatMessage[] = [
          ...history,
          { role: "user", content: message },
        ];

        const firstResponse = (await chat(
          fullSystemPrompt,
          firstCallMessages
        )) as GeminiResponse;

        let responseText: string;
        let sources: string[];
        let agendaItems: GeminiComplete["agenda_items"] | undefined;
        let recommendedContacts: string[] | undefined;

        if (firstResponse.status === "need_files") {
          controller.enqueue(
            sseEvent("status", {
              type: "searching",
              message: firstResponse.message_parent,
            })
          );

          const fileContents = loadFilesContent(firstResponse.requested_files);

          const secondResponse = (await chat(fullSystemPrompt, [
            ...firstCallMessages,
            { role: "assistant", content: JSON.stringify(firstResponse) },
            {
              role: "user",
              content: `Voici le contenu des fichiers que tu as demandés :\n\n${fileContents}\n\nMaintenant, formule ta réponse complète au parent.`,
            },
          ])) as GeminiComplete;

          responseText =
            secondResponse.response ?? "Désolé, je n'ai pas pu formuler une réponse.";
          sources = secondResponse.sources ?? firstResponse.requested_files;
          agendaItems = secondResponse.agenda_items;
          recommendedContacts = secondResponse.recommended_contacts;
        } else {
          responseText = firstResponse.response;
          sources = firstResponse.sources ?? [];
          agendaItems = (firstResponse as GeminiComplete).agenda_items;
          recommendedContacts = (firstResponse as GeminiComplete).recommended_contacts;
        }

        await streamWords(responseText, controller);
        controller.enqueue(sseEvent("done", { sources, full_response: responseText }));

        // Process agenda_items if present
        if (agendaItems && agendaItems.length > 0 && parentId) {
          const validTypes = new Set(["reunion", "examen", "echeance", "tache", "vacances", "evenement", "bulletin"]);
          const processedItems: AgendaItem[] = agendaItems.map((item) => ({
            id: crypto.randomUUID(),
            parentId,
            titre: item.titre,
            date: item.date,
            heure: item.heure ?? null,
            lieu: null,
            enfant_concerne: item.enfant_concerne ?? null,
            type: validTypes.has(item.type)
              ? (item.type as AgendaItem["type"])
              : "evenement",
            source: "agent" as const,
            description: item.description,
            fait: false,
          }));
          addAgendaItems(parentId, processedItems);
          controller.enqueue(sseEvent("agenda", { items: processedItems }));
        }

        // Process recommended_contacts if present
        if (recommendedContacts && recommendedContacts.length > 0) {
          const recommendedPersons: PersonneRessource[] = personnes.filter((p) =>
            recommendedContacts!.includes(p.id)
          );
          if (recommendedPersons.length > 0) {
            controller.enqueue(sseEvent("contacts", { contacts: recommendedPersons }));
          }
        }

        controller.close();

      } catch (error) {
        console.error("[/api/chat SSE]", error);
        controller.enqueue(
          sseEvent("status", {
            type: "error",
            message: "Une erreur est survenue, veuillez réessayer.",
          })
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadFilesContent(fileIds: string[]): string {
  return fileIds
    .slice(0, 3)
    .map((id) => {
      const content = loadKnowledgeFile(id);
      return content
        ? `=== Fichier [${id}] ===\n${content}`
        : `=== Fichier [${id}] === INTROUVABLE`;
    })
    .join("\n\n");
}
