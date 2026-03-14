"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import ContactModal from "@/components/ContactModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageStatus = "thinking" | "searching" | "streaming" | "error" | undefined;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  status?: MessageStatus;
  isWelcome?: boolean;
  imagePreview?: string; // data URL or "__pdf__"
  fileName?: string;
  agendaItems?: Array<{ titre: string; date: string; type: string; heure?: string | null }>;
}

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ChildMeta {
  prenom: string;
  classe: string;
  type_ecole: string;
  nom_ecole: string;
}

export interface ChatInterfaceProps {
  parentId: string | null;
}

interface RecommendedContact {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  langues: string[];
  disponibilite: string;
  accepte_contact_plateforme: boolean;
  sujets_expertise: string[];
  ecole_rattachee?: string | null;
  description: string;
  contact_externe?: {
    adresse?: string;
    telephone?: string;
    email?: string;
  } | null;
}

const STREAM_ID = "stream-in-progress";

// ─── Language map (BCP-47 for Web Speech API) ─────────────────────────────────

const LANG_MAP: Record<string, string> = {
  Turc: "tr-TR",
  Arabe: "ar-SA",
  Ukrainien: "uk-UA",
  Russe: "ru-RU",
  Polonais: "pl-PL",
  Roumain: "ro-RO",
  Anglais: "en-US",
  Français: "fr-FR",
  Espagnol: "es-ES",
  Italien: "it-IT",
  Portugais: "pt-PT",
  Farsi: "fa-IR",
  Dari: "fa-AF",
  Tigrinya: "ti-ER",
  Japonais: "ja-JP",
  Allemand: "de-DE",
};

// ─── TTS helpers (outside component — no stale closure risk) ──────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[\s*\-]{3,}$/gm, "")
    .replace(/^\s*[*\-]\s+/gm, "")
    .replace(/📚[^\n]*/g, "")
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitForTTS(text: string): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const para of text.split(/\n\n+/)) {
    if (!para.trim()) continue;
    if ((current + para).length > 2000) {
      if (current) chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.trim()];
}

function speakText(text: string, lang: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = stripMarkdown(text);
  const chunks = splitForTTS(clean);

  function speakChunk(idx: number) {
    if (idx >= chunks.length) return;
    const utt = new SpeechSynthesisUtterance(chunks[idx]);
    utt.lang = lang;
    utt.rate = 0.9;
    utt.pitch = 1;
    utt.onend = () => speakChunk(idx + 1);
    window.speechSynthesis.speak(utt);
  }

  speakChunk(0);
}

function stopSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

// ─── Markdown render components ───────────────────────────────────────────────

const MD_COMPONENTS: Components = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h1: ({ node, ...props }) => <h2 className="font-bold text-base mt-2 mb-1" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h2: ({ node, ...props }) => <h2 className="font-semibold text-base mt-2 mb-1" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  h3: ({ node, ...props }) => <h3 className="font-semibold text-sm mt-1.5 mb-0.5" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-0.5" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hr: ({ node, ...props }) => <hr className="my-2 border-slate-300" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto mb-2">
      <table className="text-xs border-collapse w-full" {...props} />
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  th: ({ node, ...props }) => (
    <th className="border border-slate-300 px-2 py-1 bg-slate-100 font-semibold text-left" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  td: ({ node, ...props }) => <td className="border border-slate-300 px-2 py-1" {...props} />,
};

// ─── ThinkingDots ─────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex gap-1.5 items-center py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Static welcome message builder ──────────────────────────────────────────

function buildWelcomeText(parentPrenom: string, children: ChildMeta[]): string {
  const childLines = children
    .map((c) => `• ${c.prenom} — ${c.classe}, ${c.type_ecole}, ${c.nom_ecole}`)
    .join("\n");

  return [
    `Bienvenue sur SchoolBridge, ${parentPrenom} ! 👋`,
    "",
    children.length > 0
      ? `Vos enfants enregistrés :\n${childLines}`
      : "Aucun enfant enregistré pour le moment.",
    "",
    "Posez-moi vos questions dans votre langue, je vous répondrai dans cette même langue.",
  ].join("\n");
}

// ─── Agenda item type icon ────────────────────────────────────────────────────

function getAgendaIcon(type: string): string {
  const icons: Record<string, string> = {
    reunion: "📋",
    examen: "📝",
    echeance: "⏰",
    tache: "✅",
    vacances: "🏖️",
    evenement: "🎉",
    bulletin: "📊",
  };
  return icons[type] ?? "📅";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatInterface({ parentId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [parentLang, setParentLang] = useState("de-DE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [hasTTS, setHasTTS] = useState(false);
  const [hasSTT, setHasSTT] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [pendingAgendaItems, setPendingAgendaItems] = useState<
    Array<{ titre: string; date: string; type: string; heure?: string | null }> | null
  >(null);
  const [pendingContacts, setPendingContacts] = useState<RecommendedContact[] | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState<RecommendedContact | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Refs keep latest values accessible inside stable useCallback closures
  const autoSpeakRef = useRef(true);
  const parentLangRef = useRef("de-DE");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Guard against rapid double/triple submission (ref = synchronous, not batched)
  const isSubmittingRef = useRef(false);

  const isIdentified = parentId !== null;
  const storageKey = `schoolbridge_chat_${parentId ?? "anonymous"}`;

  // Detect TTS/STT after hydration (avoids SSR mismatch)
  useEffect(() => {
    setHasTTS(typeof window !== "undefined" && "speechSynthesis" in window);
    setHasSTT(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  // Keep refs in sync with state
  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);
  useEffect(() => { parentLangRef.current = parentLang; }, [parentLang]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages to localStorage after each change (only completed messages)
  useEffect(() => {
    if (messages.length === 0) return;
    const toSave = messages.filter((m) => m.status === undefined);
    try {
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // ignore quota errors
    }
  }, [messages, storageKey]);

  // Welcome message + parent language + localStorage restore
  useEffect(() => {
    if (!isIdentified || !parentId) return;

    fetch(`/api/parents/${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        const parent = (data as { parent?: { prenom?: string; langue_maternelle?: string }; enfants?: ChildMeta[] }).parent;
        const enfants: ChildMeta[] = ((data as { enfants?: ChildMeta[] }).enfants ?? []).map(
          (e: { prenom: string; classe: string; type_ecole: string; nom_ecole: string }) => ({
            prenom: e.prenom,
            classe: e.classe,
            type_ecole: e.type_ecole,
            nom_ecole: e.nom_ecole,
          })
        );

        if (parent?.langue_maternelle && LANG_MAP[parent.langue_maternelle]) {
          setParentLang(LANG_MAP[parent.langue_maternelle]);
        }

        const welcomeMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: buildWelcomeText(parent?.prenom ?? parentId, enfants),
          isWelcome: true,
        };

        // Restore saved messages from localStorage
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const savedMessages = JSON.parse(saved) as Message[];
            // Filter out welcome messages from saved (we add a fresh one)
            const nonWelcome = savedMessages.filter((m) => !m.isWelcome);
            setMessages([welcomeMsg, ...nonWelcome]);
            return;
          }
        } catch {
          // ignore
        }

        setMessages([welcomeMsg]);
      })
      .catch(() => {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Bienvenue sur SchoolBridge ! 👋\n\nComment puis-je vous aider ?",
            isWelcome: true,
          },
        ]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Clear chat ─────────────────────────────────────────────────────────────

  function handleClear() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setMessages((prev) => prev.filter((m) => m.isWelcome));
    setPendingAgendaItems(null);
    setPendingContacts(null);
    stopSpeech();
  }

  // ── STT ───────────────────────────────────────────────────────────────────

  function startListening() {
    if (!hasSTT) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition ?? win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    // Use the browser's default language for transcription — the parent may speak
    // a different language than their registered mother tongue (e.g., French while
    // the profile says English). Gemini detects the language from the text anyway.
    recognition.lang = "";
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimAccum = "";
      let finalChunk = "";
      // event.resultIndex = index of the first NEW result in this event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript as string;
        if (event.results[i].isFinal) {
          finalChunk += transcript;
        } else {
          interimAccum += transcript;
        }
      }
      if (finalChunk) {
        // Append the finalized chunk to the existing input text
        setInput((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim());
        setInterimText("");
      } else {
        // Show only the latest interim (replaces previous interim)
        setInterimText(interimAccum);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if ((event.error as string) === "not-allowed") {
        alert("Accès au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      }
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognition.start();
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  }

  function toggleListening() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // ── SSE reader (shared between text and upload flows) ─────────────────────

  const processSSEStream = useCallback(
    async (res: Response, onDone: (text: string) => void) => {
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;
      let stopped = false;

      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          let eventType = "";
          let eventData = "";

          for (const line of part.trim().split("\n")) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData) as Record<string, unknown>;

            if (eventType === "status") {
              const type = data.type as string;
              if (type === "searching") {
                const searchingMsg = (data.message as string) ?? "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === STREAM_ID
                      ? { ...m, content: searchingMsg, status: "searching" }
                      : m
                  )
                );
                // Read the waiting message aloud if auto-speak is on
                if (autoSpeakRef.current) speakText(searchingMsg, parentLangRef.current);
              } else if (type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === STREAM_ID
                      ? {
                          ...m,
                          id: crypto.randomUUID(),
                          content: (data.message as string) ?? "Erreur.",
                          status: "error",
                        }
                      : m
                  )
                );
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 50);
                stopped = true;
                break;
              }
            } else if (eventType === "token") {
              // First token arriving — stop the searching speech if still playing
              if (firstToken) stopSpeech();
              const chunk = (data.content as string) ?? "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === STREAM_ID
                    ? {
                        ...m,
                        content: firstToken ? chunk : m.content + chunk,
                        status: "streaming",
                      }
                    : m
                )
              );
              firstToken = false;
            } else if (eventType === "done") {
              const finalText = (data.full_response as string) ?? "";
              const sources = (data.sources as string[]) ?? [];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === STREAM_ID
                    ? {
                        id: crypto.randomUUID(),
                        role: "assistant" as const,
                        content: finalText,
                        sources,
                        status: undefined,
                      }
                    : m
                )
              );
              setIsLoading(false);
              setTimeout(() => inputRef.current?.focus(), 50);
              onDone(finalText);
            } else if (eventType === "agenda") {
              const items = data.items as Array<{
                titre: string;
                date: string;
                type: string;
                heure?: string | null;
              }>;
              if (items && items.length > 0) {
                setPendingAgendaItems(items);
              }
            } else if (eventType === "contacts") {
              const contacts = data.contacts as RecommendedContact[];
              if (contacts && contacts.length > 0) {
                setPendingContacts(contacts);
              }
            }
          } catch {
            // ignore malformed event
          }
        }
      }
    },
    []
  );

  // ── Text chat stream ───────────────────────────────────────────────────────

  const runStream = useCallback(
    async (payload: {
      message: string;
      parentId: string | null;
      history: ChatHistoryItem[];
    }) => {
      setIsLoading(true);
      setPendingAgendaItems(null);
      setPendingContacts(null);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== STREAM_ID);
        return [...filtered, { id: STREAM_ID, role: "assistant", content: "", status: "thinking" }];
      });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await processSSEStream(res, (text) => {
          if (autoSpeakRef.current) speakText(text, parentLangRef.current);
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === STREAM_ID
              ? {
                  ...m,
                  id: crypto.randomUUID(),
                  content: "Erreur réseau. Veuillez réessayer.",
                  status: "error",
                }
              : m
          )
        );
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [processSSEStream]
  );

  // ── Upload stream ──────────────────────────────────────────────────────────

  const runUploadStream = useCallback(
    async (
      file: File,
      message: string,
      pid: string | null,
      history: ChatHistoryItem[]
    ) => {
      setIsLoading(true);
      setPendingAgendaItems(null);
      setPendingContacts(null);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== STREAM_ID);
        return [...filtered, { id: STREAM_ID, role: "assistant", content: "", status: "thinking" }];
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("message", message);
        formData.append("parentId", pid ?? "");
        formData.append("history", JSON.stringify(history));

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        await processSSEStream(res, (text) => {
          if (autoSpeakRef.current) speakText(text, parentLangRef.current);
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === STREAM_ID
              ? {
                  ...m,
                  id: crypto.randomUUID(),
                  content: "Erreur réseau. Veuillez réessayer.",
                  status: "error",
                }
              : m
          )
        );
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [processSSEStream]
  );

  // ── History ────────────────────────────────────────────────────────────────

  function buildHistory(): ChatHistoryItem[] {
    return messages
      .filter((m) => m.status === undefined && !m.isWelcome)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 10 MB).");
      return;
    }

    setSelectedFile(file);

    if (file.type === "application/pdf") {
      setFilePreview("__pdf__");
    } else {
      const fr = new FileReader();
      fr.onload = (ev) => setFilePreview(ev.target?.result as string);
      fr.readAsDataURL(file);
    }

    e.target.value = "";
  }

  function clearFile() {
    setSelectedFile(null);
    setFilePreview(null);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !selectedFile) || isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    stopSpeech();
    if (isListening) stopListening();

    try {
      if (selectedFile) {
        const userMsg: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          imagePreview: filePreview ?? undefined,
          fileName: selectedFile.name,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        const file = selectedFile;
        clearFile();
        await runUploadStream(file, text, parentId, buildHistory());
      } else {
        const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        await runStream({ message: text, parentId, history: buildHistory() });
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-w-3xl mx-auto w-full">

        {/* Anonymous welcome */}
        {!isIdentified && messages.length === 0 && (
          <div className="self-start bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] text-sm">
            <ReactMarkdown components={MD_COMPONENTS}>
              {"Bienvenue sur SchoolBridge ! 👋\n\nJe suis votre mentor scolaire. Posez-moi vos questions sur le système scolaire allemand dans votre langue."}
            </ReactMarkdown>
          </div>
        )}

        {messages.map((msg) => {

          // ── User bubble ────────────────────────────────────────────────────
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] px-4 py-3 bg-blue-600 text-white rounded-2xl rounded-br-sm break-words">
                  {msg.imagePreview === "__pdf__" && (
                    <div className="flex items-center gap-2 mb-2 bg-blue-500 rounded-lg px-3 py-2">
                      <span className="text-xl">📄</span>
                      <span className="text-xs text-blue-100 truncate max-w-[160px]">
                        {msg.fileName ?? "Document PDF"}
                      </span>
                    </div>
                  )}
                  {msg.imagePreview && msg.imagePreview !== "__pdf__" && (
                    <img
                      src={msg.imagePreview}
                      alt="Document envoyé"
                      className="max-w-[200px] rounded-lg mb-2 object-contain"
                    />
                  )}
                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          }

          // ── Thinking ───────────────────────────────────────────────────────
          if (msg.status === "thinking") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl rounded-bl-sm">
                  <ThinkingDots />
                </div>
              </div>
            );
          }

          // ── Searching ──────────────────────────────────────────────────────
          if (msg.status === "searching") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl rounded-bl-sm break-words">
                  <p className="text-sm italic flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">🔍</span>
                    <span>{msg.content}</span>
                  </p>
                </div>
              </div>
            );
          }

          // ── Error ──────────────────────────────────────────────────────────
          if (msg.status === "error") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[80%] px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl rounded-bl-sm break-words">
                  <p className="text-sm flex items-start gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{msg.content}</span>
                  </p>
                </div>
              </div>
            );
          }

          // ── Streaming or completed (+ welcome) ────────────────────────────
          const isCompleted = msg.status === undefined && !msg.isWelcome;

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm break-words">

                {/* Markdown content */}
                <div className="text-sm">
                  <ReactMarkdown components={MD_COMPONENTS}>{msg.content}</ReactMarkdown>
                  {msg.status === "streaming" && (
                    <span className="inline-block w-0.5 h-4 bg-slate-500 ml-0.5 align-middle animate-pulse" />
                  )}
                </div>

                {/* Source badges */}
                {isCompleted && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.sources.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs bg-slate-200 text-slate-600 rounded-full px-2 py-0.5"
                      >
                        📚 {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* TTS controls */}
                {hasTTS && isCompleted && (
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => speakText(msg.content, parentLangRef.current)}
                      title="Lire ce message"
                      className="text-slate-400 hover:text-slate-600 transition-colors text-sm leading-none"
                    >
                      🔊
                    </button>
                    <button
                      type="button"
                      onClick={stopSpeech}
                      title="Arrêter la lecture"
                      className="text-slate-400 hover:text-slate-600 transition-colors text-sm leading-none"
                    >
                      ⏹
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Agenda notification banner */}
        {pendingAgendaItems && pendingAgendaItems.length > 0 && (
          <div className="self-stretch bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-green-800">
                📅 {pendingAgendaItems.length} événement{pendingAgendaItems.length > 1 ? "s" : ""} ajouté{pendingAgendaItems.length > 1 ? "s" : ""} à votre agenda
              </p>
              <button
                onClick={() => setPendingAgendaItems(null)}
                className="text-green-600 hover:text-green-800 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <ul className="space-y-1">
              {pendingAgendaItems.map((item, i) => (
                <li key={i} className="text-green-700 flex items-center gap-2">
                  <span>{getAgendaIcon(item.type)}</span>
                  <span className="font-medium">{item.titre}</span>
                  <span className="text-green-600">— {item.date}{item.heure ? ` à ${item.heure}` : ""}</span>
                </li>
              ))}
            </ul>
            {parentId && (
              <a
                href={`/dashboard?parentId=${parentId}`}
                className="mt-2 inline-block text-xs text-green-700 underline"
              >
                Voir dans le dashboard →
              </a>
            )}
          </div>
        )}

        {/* Recommended contact cards */}
        {pendingContacts && pendingContacts.length > 0 && (
          <div className="self-stretch flex flex-col gap-2">
            {pendingContacts.map((contact) => (
              <div key={contact.id} className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm">
                {contact.accepte_contact_plateforme ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-blue-900">
                          📨 {contact.prenom} {contact.nom}
                        </p>
                        <p className="text-blue-700 text-xs mt-0.5">{contact.role}</p>
                        {contact.disponibilite && (
                          <p className="text-blue-600 text-xs mt-0.5">
                            Disponible : {contact.disponibilite}
                          </p>
                        )}
                        {contact.sujets_expertise && contact.sujets_expertise.length > 0 && (
                          <p className="text-blue-500 text-xs mt-0.5">
                            Expertise : {contact.sujets_expertise.join(", ")}
                          </p>
                        )}
                      </div>
                      {parentId && (
                        <button
                          onClick={() => setContactModalOpen(contact)}
                          className="shrink-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Envoyer un message
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-blue-900">
                      📞 {contact.prenom} {contact.nom} — {contact.role}
                    </p>
                    {contact.ecole_rattachee && (
                      <p className="text-blue-700 text-xs mt-0.5">{contact.ecole_rattachee}</p>
                    )}
                    {contact.disponibilite && (
                      <p className="text-blue-600 text-xs mt-0.5">
                        Horaires : {contact.disponibilite}
                      </p>
                    )}
                    {contact.contact_externe?.telephone && (
                      <a
                        href={`tel:${contact.contact_externe.telephone}`}
                        className="block text-blue-700 text-xs mt-0.5 underline"
                      >
                        Tél : {contact.contact_externe.telephone}
                      </a>
                    )}
                    {contact.contact_externe?.email && (
                      <a
                        href={`mailto:${contact.contact_externe.email}`}
                        className="block text-blue-700 text-xs mt-0.5 underline"
                      >
                        Email : {contact.contact_externe.email}
                      </a>
                    )}
                    {contact.contact_externe?.adresse && (
                      <p className="text-blue-600 text-xs mt-0.5">{contact.contact_externe.adresse}</p>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => setPendingContacts(null)}
              className="self-end text-xs text-blue-400 hover:text-blue-600"
            >
              ✕ Masquer
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {selectedFile && (
        <div className="max-w-3xl mx-auto w-full px-3 pb-1 flex items-center gap-2">
          {filePreview === "__pdf__" ? (
            <div className="flex items-center gap-2 h-14 px-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-2xl">📄</span>
              <span className="text-xs text-slate-600 truncate max-w-[180px]">
                {selectedFile.name}
              </span>
            </div>
          ) : filePreview ? (
            <img
              src={filePreview}
              alt="Aperçu"
              className="h-14 w-auto rounded-lg border border-slate-200 object-contain bg-white"
            />
          ) : null}
          <button
            type="button"
            onClick={clearFile}
            className="w-5 h-5 bg-slate-400 hover:bg-slate-600 text-white rounded-full text-xs flex items-center justify-center transition-colors"
          >
            ×
          </button>
          <span className="text-xs text-slate-400 truncate max-w-[200px]">{selectedFile.name}</span>
        </div>
      )}

      {/* Interim STT text */}
      {interimText && (
        <div className="max-w-3xl mx-auto w-full px-3 pb-1">
          <p className="text-sm text-slate-400 italic px-4 py-1 bg-slate-50 rounded-lg border border-slate-200">
            {interimText}
          </p>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-3 border-t border-slate-200 bg-white max-w-3xl mx-auto w-full"
      >
        {/* TTS auto toggle */}
        {hasTTS && (
          <button
            type="button"
            onClick={() => setAutoSpeak((v) => !v)}
            title={autoSpeak ? "Désactiver la lecture automatique" : "Activer la lecture automatique"}
            className={`shrink-0 w-9 h-9 rounded-xl text-base flex items-center justify-center transition-colors ${
              autoSpeak
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            {autoSpeak ? "🔊" : "🔇"}
          </button>
        )}

        {/* STT microphone */}
        {hasSTT && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            title={isListening ? "Arrêter la dictée" : "Dicter un message"}
            className={`shrink-0 w-9 h-9 rounded-xl text-base flex items-center justify-center transition-colors disabled:opacity-50 ${
              isListening
                ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            🎙️
          </button>
        )}

        {/* File upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Envoyer un document (image ou PDF)"
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 text-lg"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening
              ? "Parlez maintenant..."
              : selectedFile
              ? "Ajouter un message (optionnel)..."
              : "Tapez votre message..."
          }
          disabled={isLoading}
          autoFocus
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          title="Effacer la conversation"
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 text-base"
        >
          🗑️
        </button>

        {/* Send */}
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !selectedFile)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Envoyer
        </button>
      </form>

      {/* Contact modal */}
      {contactModalOpen && parentId && (
        <ContactModal
          personneId={contactModalOpen.id}
          nom={`${contactModalOpen.prenom} ${contactModalOpen.nom}`}
          role={contactModalOpen.role}
          disponibilite={contactModalOpen.disponibilite}
          description={contactModalOpen.description}
          parentId={parentId}
          onClose={() => setContactModalOpen(null)}
          onSuccess={() => setContactModalOpen(null)}
        />
      )}
    </div>
  );
}
