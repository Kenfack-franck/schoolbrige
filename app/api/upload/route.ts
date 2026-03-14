import { NextRequest } from "next/server";
import { chatWithImage, chat, type ChatMessage } from "@/lib/gemini";
import {
  loadParents,
  loadChildrenOf,
  loadInventaire,
  loadPersonnesRessources,
  loadKnowledgeFile,
} from "@/lib/data";
import {
  SCHOOLBRIDGE_SYSTEM_PROMPT,
  buildContextPrompt,
  buildAnonymousPrompt,
} from "@/lib/prompts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeminiNeedFiles {
  status: "need_files";
  requested_files: string[];
  message_parent: string;
}

interface GeminiComplete {
  status: "complete";
  response: string;
  sources: string[];
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

// ─── Document analysis instruction ───────────────────────────────────────────

const DOCUMENT_ANALYSIS_PROMPT = `
Le parent t'envoie un document scolaire (image ou PDF). Analyse ce document en suivant ces étapes :

1. IDENTIFIE le type de document (lettre/convocation, bulletin/Zeugnis, formulaire d'inscription, information générale, recommandation d'orientation, autre)
2. TRADUIS et RÉSUME le contenu dans la langue du parent en langage simple
3. EXTRAIS les informations clés : dates, noms, chiffres importants
4. LISTE les actions concrètes que le parent doit faire, avec les délais s'il y en a
5. Si le document mentionne des concepts scolaires allemands, EXPLIQUE-les simplement

Si tu as besoin de fichiers de la base de connaissances pour contextualiser (par exemple le calendrier de l'école, les procédures), demande-les avec le format habituel {"status": "need_files", ...}.

Sinon, réponds directement avec {"status": "complete", "response": "...", "sources": [...]}.
`.trim();

// ─── POST /api/upload — SSE ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userMessage = (formData.get("message") as string) ?? "";
  const parentIdRaw = (formData.get("parentId") as string) ?? "";
  const parentId = parentIdRaw || null;
  const historyRaw = (formData.get("history") as string) ?? "[]";

  if (!file) {
    return new Response(JSON.stringify({ error: "Aucun fichier reçu." }), { status: 400 });
  }

  let history: ChatMessage[] = [];
  try {
    history = JSON.parse(historyRaw) as ChatMessage[];
  } catch {
    history = [];
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(sseEvent("status", { type: "thinking" }));

        const inventaire = loadInventaire();
        const personnes = loadPersonnesRessources();

        let systemPrompt: string;

        if (parentId) {
          const parents = loadParents();
          const parent = parents.find((p) => p.id === parentId);
          if (!parent) {
            controller.enqueue(
              sseEvent("status", { type: "error", message: "Parent introuvable." })
            );
            controller.close();
            return;
          }
          const children = loadChildrenOf(parentId);
          const contextPrompt = buildContextPrompt(parent, children, inventaire, personnes);
          systemPrompt = `${SCHOOLBRIDGE_SYSTEM_PROMPT}\n\n${contextPrompt}\n\n${DOCUMENT_ANALYSIS_PROMPT}`;
        } else {
          systemPrompt = `${buildAnonymousPrompt(inventaire, personnes)}\n\n${DOCUMENT_ANALYSIS_PROMPT}`;
        }

        const textToSend = userMessage || "Analyse ce document scolaire.";

        const firstResponse = (await chatWithImage(
          systemPrompt,
          history,
          base64,
          mimeType,
          textToSend
        )) as GeminiResponse;

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

          const secondResponse = (await chat(systemPrompt, [
            ...history,
            { role: "user", content: textToSend },
            { role: "assistant", content: JSON.stringify(firstResponse) },
            {
              role: "user",
              content: `Voici le contenu des fichiers que tu as demandés :\n\n${fileContents}\n\nMaintenant, formule ta réponse complète.`,
            },
          ])) as GeminiComplete;

          responseText = secondResponse.response ?? "Désolé, je n'ai pas pu formuler une réponse.";
          sources = secondResponse.sources ?? firstResponse.requested_files;
        } else {
          responseText = firstResponse.response;
          sources = firstResponse.sources ?? [];
        }

        await streamWords(responseText, controller);
        controller.enqueue(sseEvent("done", { sources, full_response: responseText }));
        controller.close();
      } catch (error) {
        console.error("[/api/upload SSE]", error);
        controller.enqueue(
          sseEvent("status", {
            type: "error",
            message: "Erreur lors de l'analyse du document. Veuillez réessayer.",
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
