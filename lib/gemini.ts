import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Merges consecutive same-role messages to satisfy Gemini's alternating-role requirement.
 * Gemini rejects histories with two consecutive "user" or "model" turns.
 */
function sanitizeHistory(contents: Content[]): Content[] {
  const result: Content[] = [];
  for (const content of contents) {
    const last = result[result.length - 1];
    if (last && last.role === content.role) {
      // Merge into previous message (append text parts)
      last.parts = [...last.parts, ...content.parts];
    } else {
      result.push({ role: content.role, parts: [...content.parts] });
    }
  }
  return result;
}

/**
 * Sends a conversation to Gemini and returns the parsed JSON response.
 * Uses responseMimeType: "application/json" to ensure valid JSON output.
 */
export async function chat(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<unknown> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  // Convert our message format to Gemini's Content format
  const rawHistory: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Sanitize: merge consecutive same-role turns (e.g. 3 user messages in a row)
  const history = sanitizeHistory(rawHistory);

  const lastMessage = messages[messages.length - 1];

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(lastMessage.content);
  const rawText = result.response.text();

  return parseJsonResponse(rawText);
}

/**
 * Sends a conversation + image to Gemini (multimodal) and returns the parsed JSON response.
 */
export async function chatWithImage(
  systemPrompt: string,
  history: ChatMessage[],
  imageBase64: string,
  imageMimeType: string,
  userText: string
): Promise<unknown> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });

  const historyContents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const result = await model.generateContent({
    contents: [
      ...historyContents,
      {
        role: "user",
        parts: [
          { text: userText || "Analyse ce document scolaire." },
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
        ],
      },
    ],
  });

  return parseJsonResponse(result.response.text());
}

/**
 * Extracts and parses JSON from a Gemini response.
 * Handles optional markdown code fences as fallback.
 */
function parseJsonResponse(raw: string): unknown {
  let text = raw.trim();

  // Strip markdown code fences if present (fallback)
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    // Last resort: extract first JSON object/array
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // ignore and fall through
      }
    }
    throw new Error(`Gemini returned non-JSON response: ${raw.slice(0, 300)}`);
  }
}
