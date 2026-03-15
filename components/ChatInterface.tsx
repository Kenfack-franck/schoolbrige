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
  imagePreview?: string;
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

interface UrgentPost {
  id: string;
  titre: string;
  contenu_court: string;
  auteur_nom: string;
  auteur_role: string;
  epingle: boolean;
}

interface ParentMeta {
  prenom: string;
  initiales: string;
  langNom: string;
  enfants: ChildMeta[];
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

// ─── TTS helpers ──────────────────────────────────────────────────────────────

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
    utt.rate = 1.15;
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
  hr: ({ node, ...props }) => <hr className="my-2 border-line" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto mb-2">
      <table className="text-xs border-collapse w-full" {...props} />
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  th: ({ node, ...props }) => (
    <th className="border border-line px-2 py-1 bg-canvas-muted font-semibold text-left" {...props} />
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  td: ({ node, ...props }) => <td className="border border-line px-2 py-1" {...props} />,
};

// ─── ThinkingDots (3 primary-light dots with cascade bounce) ─────────────────

function ThinkingDots() {
  return (
    <div className="flex gap-1.5 items-center py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            backgroundColor: "var(--color-primary-light)",
            animation: "dot-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 200}ms`,
          }}
        />
      ))}
    </div>
  );
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
  const [communityNotification, setCommunityNotification] = useState<string | null>(null);
  const [urgentPosts, setUrgentPosts] = useState<UrgentPost[]>([]);
  const [urgentDismissed, setUrgentDismissed] = useState(false);

  // Design 2: parent meta for context bar
  const [parentMeta, setParentMeta] = useState<ParentMeta | null>(null);
  // Design 2: notification panel
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSpeakRef = useRef(true);
  const parentLangRef = useRef("de-DE");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isSubmittingRef = useRef(false);
  const isSearchingSpeechActiveRef = useRef(false);
  const pendingResponseTextRef = useRef<string | null>(null);
  const shouldAutoSubmitRef = useRef(false);
  const [sttSubmitTrigger, setSttSubmitTrigger] = useState(0);
  const pendingSTTTextRef = useRef<string>("");

  const isIdentified = parentId !== null;
  const storageKey = `schoolbridge_chat_${parentId ?? "anonymous"}`;

  // Detect TTS/STT after hydration
  useEffect(() => {
    setHasTTS(typeof window !== "undefined" && "speechSynthesis" in window);
    setHasSTT(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);
  useEffect(() => { parentLangRef.current = parentLang; }, [parentLang]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length === 0) return;
    const toSave = messages.filter((m) => m.status === undefined);
    try { localStorage.setItem(storageKey, JSON.stringify(toSave)); } catch { /* ignore */ }
  }, [messages, storageKey]);

  // Auto-submit after STT recording ends
  useEffect(() => {
    if (sttSubmitTrigger === 0) return;
    const text = pendingSTTTextRef.current.trim();
    if (!text || isLoading) return;
    pendingSTTTextRef.current = "";
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    stopSpeech();
    isSearchingSpeechActiveRef.current = false;
    pendingResponseTextRef.current = null;
    isSubmittingRef.current = true;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    const history = messages
      .filter((m) => m.status === undefined && !m.isWelcome)
      .map((m) => ({ role: m.role, content: m.content }));
    runStream({ message: text, parentId, history }).finally(() => {
      isSubmittingRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sttSubmitTrigger]);

  // Welcome message + parent meta + localStorage restore
  useEffect(() => {
    if (!isIdentified || !parentId) return;

    fetch(`/api/parents/${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        const parent = (data as {
          parent?: { prenom?: string; nom?: string; langue_maternelle?: string };
          enfants?: ChildMeta[];
        }).parent;
        const enfants: ChildMeta[] = ((data as { enfants?: ChildMeta[] }).enfants ?? []);

        if (parent?.langue_maternelle && LANG_MAP[parent.langue_maternelle]) {
          setParentLang(LANG_MAP[parent.langue_maternelle]);
        }

        // Build parent meta for context bar
        const prenom = parent?.prenom ?? parentId;
        const nom = parent?.nom ?? "";
        const initiales = `${prenom[0] ?? "?"}${nom[0] ?? ""}`.toUpperCase();
        setParentMeta({
          prenom,
          initiales,
          langNom: parent?.langue_maternelle ?? "Français",
          enfants,
        });

        const childLines = enfants
          .map((c) => `• **${c.prenom}** — ${c.classe}, ${c.type_ecole}, ${c.nom_ecole}`)
          .join("\n");

        const welcomeText = [
          `Bienvenue sur SchoolBridge, ${prenom} ! 👋`,
          "",
          enfants.length > 0 ? `Vos enfants enregistrés :\n${childLines}` : "Aucun enfant enregistré.",
          "",
          "Posez-moi vos questions dans votre langue, je vous répondrai dans cette même langue.",
        ].join("\n");

        const welcomeMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: welcomeText,
          isWelcome: true,
        };

        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const savedMessages = JSON.parse(saved) as Message[];
            const nonWelcome = savedMessages.filter((m) => !m.isWelcome);
            setMessages([welcomeMsg, ...nonWelcome]);
            return;
          }
        } catch { /* ignore */ }

        setMessages([welcomeMsg]);
      })
      .catch(() => {
        setMessages([{
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Bienvenue sur SchoolBridge ! 👋\n\nComment puis-je vous aider ?",
          isWelcome: true,
        }]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load urgent community posts
  useEffect(() => {
    if (!parentId) return;
    const dismissed = sessionStorage.getItem(`urgent_dismissed_${parentId}`);
    if (dismissed) { setUrgentDismissed(true); return; }
    fetch(`/api/community/urgent?parentId=${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        const posts = (data as { urgent_posts?: UrgentPost[] }).urgent_posts ?? [];
        if (posts.length > 0) setUrgentPosts(posts);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissUrgentBanner() {
    if (parentId) {
      try { sessionStorage.setItem(`urgent_dismissed_${parentId}`, "1"); } catch { /* ignore */ }
    }
    setUrgentDismissed(true);
    setNotifPanelOpen(false);
  }

  // Translate an urgent post in the notification panel
  async function translateUrgentPost(postId: string) {
    if (translatedPosts[postId] || translatingId === postId) return;
    setTranslatingId(postId);
    try {
      const res = await fetch("/api/community/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, targetLang: parentMeta?.langNom ?? "Français" }),
      });
      const data = (await res.json()) as { traduit?: string };
      if (data.traduit) {
        setTranslatedPosts((prev) => ({ ...prev, [postId]: data.traduit! }));
      }
    } catch { /* ignore */ }
    setTranslatingId(null);
  }

  // ── Clear chat ─────────────────────────────────────────────────────────────

  function handleClear() {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    setMessages((prev) => prev.filter((m) => m.isWelcome));
    setPendingAgendaItems(null);
    setPendingContacts(null);
    setCommunityNotification(null);
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
    recognition.lang = "";
    recognition.continuous = true;
    recognition.interimResults = true;

    let accumulated = ""; // texte final cumulé dans cette session

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimAccum = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript as string;
        if (event.results[i].isFinal) finalChunk += transcript;
        else interimAccum += transcript;
      }
      if (finalChunk) {
        accumulated = accumulated ? `${accumulated} ${finalChunk}`.trim() : finalChunk.trim();
        setInput(accumulated);
        setInterimText("");
        setTimeout(() => {
          const el = inputRef.current;
          if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 140)}px`; }
        }, 0);
      } else {
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
      // Si du texte a été capturé, déclencher l'envoi automatique
      if (accumulated.trim() && !isSubmittingRef.current) {
        pendingSTTTextRef.current = accumulated.trim();
        setSttSubmitTrigger((n) => n + 1); // toujours un changement → useEffect se déclenche
      }
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
    if (isListening) stopListening();
    else startListening();
  }

  // ── Textarea auto-resize ──────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  // ── SSE reader ────────────────────────────────────────────────────────────

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
                    m.id === STREAM_ID ? { ...m, content: searchingMsg, status: "searching" } : m
                  )
                );
                if (autoSpeakRef.current) {
                  window.speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(stripMarkdown(searchingMsg));
                  utt.lang = parentLangRef.current;
                  utt.rate = 1.15;
                  isSearchingSpeechActiveRef.current = true;
                  utt.onend = () => {
                    isSearchingSpeechActiveRef.current = false;
                    const pending = pendingResponseTextRef.current;
                    if (pending !== null) {
                      pendingResponseTextRef.current = null;
                      setTimeout(() => speakText(pending, parentLangRef.current), 400);
                    }
                  };
                  window.speechSynthesis.speak(utt);
                }
              } else if (type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === STREAM_ID
                      ? { ...m, id: crypto.randomUUID(), content: (data.message as string) ?? "Erreur.", status: "error" }
                      : m
                  )
                );
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 50);
                stopped = true;
                break;
              }
            } else if (eventType === "token") {
              const chunk = (data.content as string) ?? "";
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === STREAM_ID
                    ? { ...m, content: firstToken ? chunk : m.content + chunk, status: "streaming" }
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
                    ? { id: crypto.randomUUID(), role: "assistant" as const, content: finalText, sources, status: undefined }
                    : m
                )
              );
              setIsLoading(false);
              setTimeout(() => inputRef.current?.focus(), 50);
              onDone(finalText);
            } else if (eventType === "agenda") {
              const items = data.items as Array<{ titre: string; date: string; type: string; heure?: string | null }>;
              if (items && items.length > 0) setPendingAgendaItems(items);
            } else if (eventType === "contacts") {
              const contacts = data.contacts as RecommendedContact[];
              if (contacts && contacts.length > 0) setPendingContacts(contacts);
            } else if (eventType === "community") {
              const titre = data.titre as string;
              if (titre) setCommunityNotification(titre);
            }
          } catch { /* ignore malformed event */ }
        }
      }
    },
    []
  );

  // ── Text chat stream ───────────────────────────────────────────────────────

  const runStream = useCallback(
    async (payload: { message: string; parentId: string | null; history: ChatHistoryItem[] }) => {
      setIsLoading(true);
      setPendingAgendaItems(null);
      setPendingContacts(null);
      setCommunityNotification(null);
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
          if (!autoSpeakRef.current) return;
          if (isSearchingSpeechActiveRef.current) {
            pendingResponseTextRef.current = text;
          } else {
            speakText(text, parentLangRef.current);
          }
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === STREAM_ID
              ? { ...m, id: crypto.randomUUID(), content: "Erreur réseau. Veuillez réessayer.", status: "error" }
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
    async (file: File, message: string, pid: string | null, history: ChatHistoryItem[]) => {
      setIsLoading(true);
      setPendingAgendaItems(null);
      setPendingContacts(null);
      setCommunityNotification(null);
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
          if (!autoSpeakRef.current) return;
          if (isSearchingSpeechActiveRef.current) {
            pendingResponseTextRef.current = text;
          } else {
            speakText(text, parentLangRef.current);
          }
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === STREAM_ID
              ? { ...m, id: crypto.randomUUID(), content: "Erreur réseau. Veuillez réessayer.", status: "error" }
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
    if (file.size > 10 * 1024 * 1024) { alert("Fichier trop volumineux (max 10 MB)."); return; }
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

  function clearFile() { setSelectedFile(null); setFilePreview(null); }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !selectedFile) || isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    stopSpeech();
    isSearchingSpeechActiveRef.current = false;
    pendingResponseTextRef.current = null;
    if (isListening) stopListening();

    // Reset textarea height
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

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

  // Handle Enter key in textarea (Shift+Enter = newline, Enter = submit)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasInput = input.trim() || selectedFile;
  const urgentCount = urgentPosts.length;

  const showXlSidebar = isIdentified && !urgentDismissed && urgentPosts.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 xl:flex-row xl:overflow-hidden">

      {/* ── Main chat column ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0">

      {/* ── Context bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-line px-4 py-2 flex items-center gap-3">
        {/* Agent identity + status */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0"
            style={{ background: "var(--color-accent)" }}
          >
            🎓
          </div>
          <div className="hidden sm:flex flex-col">
            <p className="text-xs font-semibold text-foreground leading-tight">SchoolBridge Assistant</p>
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"
                style={{ animation: "dot-bounce 2s ease-in-out infinite" }}
              />
              En ligne
            </span>
          </div>
        </div>

        {/* Divider */}
        {isIdentified && (
          <div className="hidden sm:block w-px h-6 bg-line shrink-0" />
        )}

        {/* Parent info */}
        {isIdentified && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              {parentMeta ? parentMeta.initiales : "…"}
            </div>
            <div className="min-w-0">
              {parentMeta ? (
                <>
                  <p className="text-xs font-semibold text-foreground leading-tight truncate">
                    {parentMeta.prenom}
                  </p>
                  {parentMeta.enfants.length > 0 && (
                    <p className="text-[10px] text-muted leading-tight truncate">
                      {parentMeta.enfants.map((e) => `${e.prenom} · ${e.classe}`).join("  |  ")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-muted">Chargement…</p>
              )}
            </div>
          </div>
        )}
        {!isIdentified && <div className="flex-1" />}

        {/* Right-side controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isIdentified && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              title="Effacer la conversation"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-canvas-muted hover:text-foreground transition-colors disabled:opacity-40 text-sm"
            >
              🗑️
            </button>
          )}
          {hasTTS && (
            <button
              type="button"
              onClick={() => setAutoSpeak((v) => !v)}
              title={autoSpeak ? "Désactiver la lecture automatique" : "Activer la lecture automatique"}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                autoSpeak
                  ? "text-primary bg-primary-lighter"
                  : "text-muted bg-canvas-muted"
              }`}
            >
              {autoSpeak ? "🔊" : "🔇"}
            </button>
          )}
          {isIdentified && !urgentDismissed && urgentCount > 0 && (
            <button
              type="button"
              onClick={() => setNotifPanelOpen((v) => !v)}
              title={`${urgentCount} message${urgentCount > 1 ? "s" : ""} urgent${urgentCount > 1 ? "s" : ""}`}
              className="xl:hidden relative w-8 h-8 rounded-full flex items-center justify-center bg-accent-light hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm">🔔</span>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--color-accent)" }}>
                {urgentCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 max-w-3xl mx-auto w-full">

        {/* Anonymous welcome */}
        {!isIdentified && messages.length === 0 && (
          <div className="flex justify-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base shrink-0 mt-1"
              style={{ background: "var(--color-accent)" }}
            >
              🎓
            </div>
            <div className="max-w-[80%] px-5 py-4 bg-white border border-line text-foreground rounded-2xl rounded-bl-md break-words text-base"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <ReactMarkdown components={MD_COMPONENTS}>
                {"Bienvenue sur SchoolBridge ! 👋\n\nJe suis votre mentor scolaire. Posez-moi vos questions sur le système scolaire allemand dans votre langue."}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const isFirstInSeries = !prevMsg || prevMsg.role !== msg.role || prevMsg.isWelcome;

          // ── Welcome card ────────────────────────────────────────────────────
          if (msg.isWelcome && parentMeta) {
            return (
              <div key={msg.id} className="flex justify-start gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shrink-0 mt-1"
                  style={{ background: "var(--color-accent)" }}
                >
                  🎓
                </div>
                <div
                  className="max-w-[85%] rounded-2xl rounded-bl-md overflow-hidden border border-line"
                  style={{
                    background: "linear-gradient(135deg, var(--color-primary-lighter) 0%, #ffffff 60%)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Card header */}
                  <div className="px-5 pt-4 pb-3">
                    <p className="font-display font-bold text-primary text-base leading-snug">
                      Bonjour, {parentMeta.prenom} ! 👋
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      Je suis votre mentor scolaire personnalisé pour le système allemand.
                    </p>
                  </div>

                  {/* Children cards */}
                  {parentMeta.enfants.length > 0 && (
                    <div className="px-4 pb-3 flex flex-col gap-2">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide px-1">
                        Vos enfants
                      </p>
                      {parentMeta.enfants.map((child, i) => (
                        <div
                          key={i}
                          className="bg-white rounded-xl px-3 py-2 border border-line flex items-center gap-2"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "var(--color-primary)" }}
                          >
                            {child.prenom[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                              {child.prenom}
                            </p>
                            <p className="text-xs text-muted leading-tight truncate">
                              {child.classe} · {child.nom_ecole}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bottom hint */}
                  <div className="px-5 pb-4">
                    <p className="text-xs text-muted">
                      Posez vos questions dans votre langue, je vous réponds dans cette même langue.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Fallback for welcome without parentMeta (shouldn't happen)
          if (msg.isWelcome) return null;

          // ── User bubble ─────────────────────────────────────────────────────
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div
                  className="max-w-[80%] px-5 py-3.5 text-white rounded-2xl rounded-br-md break-words"
                  style={{ background: "var(--color-primary)" }}
                >
                  {msg.imagePreview === "__pdf__" && (
                    <div
                      className="flex items-center gap-2 mb-2 rounded-lg px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <span className="text-xl">📄</span>
                      <span className="text-xs text-white/80 truncate max-w-[160px]">
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
                    <p className="whitespace-pre-wrap leading-relaxed text-base">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          }

          // ── Thinking ────────────────────────────────────────────────────────
          if (msg.status === "thinking") {
            return (
              <div key={msg.id} className="flex justify-start gap-3">
                {isFirstInSeries && (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base shrink-0 mt-1"
                    style={{ background: "var(--color-accent)" }}
                  >
                    🎓
                  </div>
                )}
                {!isFirstInSeries && <div className="w-10 shrink-0" />}
                <div
                  className="px-5 py-3.5 bg-white border border-line rounded-2xl rounded-bl-md"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <ThinkingDots />
                </div>
              </div>
            );
          }

          // ── Searching ───────────────────────────────────────────────────────
          if (msg.status === "searching") {
            return (
              <div key={msg.id} className="flex justify-start gap-3">
                {isFirstInSeries && (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base shrink-0 mt-1"
                    style={{ background: "var(--color-accent)" }}
                  >
                    🎓
                  </div>
                )}
                {!isFirstInSeries && <div className="w-10 shrink-0" />}
                <div
                  className="max-w-[80%] px-5 py-3.5 rounded-2xl rounded-bl-md break-words"
                  style={{
                    background: "var(--color-accent-light)",
                    border: "1.5px solid var(--color-accent)",
                    animation: "border-pulse 1.8s ease-in-out infinite",
                  }}
                >
                  <p className="text-base italic flex items-start gap-2" style={{ color: "var(--color-accent-dark)" }}>
                    <span className="shrink-0 mt-0.5">🔍</span>
                    <span>{msg.content}</span>
                  </p>
                </div>
              </div>
            );
          }

          // ── Error ───────────────────────────────────────────────────────────
          if (msg.status === "error") {
            return (
              <div key={msg.id} className="flex justify-start gap-3">
                <div className="w-10 shrink-0" />
                <div className="max-w-[80%] px-5 py-3.5 bg-danger-light border border-danger text-danger rounded-2xl rounded-bl-md break-words">
                  <p className="text-base flex items-start gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{msg.content}</span>
                  </p>
                </div>
              </div>
            );
          }

          // ── Streaming or completed ──────────────────────────────────────────
          const isCompleted = msg.status === undefined;
          const showSources = isCompleted && msg.sources && msg.sources.length > 0;

          return (
            <div key={msg.id} className="flex justify-start gap-3">
              {isFirstInSeries ? (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base shrink-0 mt-1"
                  style={{ background: "var(--color-accent)" }}
                >
                  🎓
                </div>
              ) : (
                <div className="w-10 shrink-0" />
              )}
              <div className="max-w-[80%] flex flex-col gap-1.5">
                {/* Bubble */}
                <div
                  className="px-5 py-4 bg-white border border-line text-foreground rounded-2xl rounded-bl-md break-words"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="text-base">
                    <ReactMarkdown components={MD_COMPONENTS}>{msg.content}</ReactMarkdown>
                    {msg.status === "streaming" && (
                      <span
                        className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                        style={{
                          background: "var(--color-primary)",
                          animation: "blink-cursor 0.9s step-end infinite",
                        }}
                      />
                    )}
                  </div>

                  {/* TTS controls (completed only) */}
                  {hasTTS && isCompleted && (
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(msg.content, parentLangRef.current)}
                        title="Lire ce message"
                        className="text-muted hover:text-foreground transition-colors text-sm leading-none"
                      >
                        🔊
                      </button>
                      <button
                        type="button"
                        onClick={stopSpeech}
                        title="Arrêter la lecture"
                        className="text-muted hover:text-foreground transition-colors text-sm leading-none"
                      >
                        ⏹
                      </button>
                    </div>
                  )}
                </div>

                {/* Source badges — BELOW the bubble */}
                {showSources && (
                  <div className="flex flex-wrap gap-1 pl-1">
                    {msg.sources!.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-muted rounded-full px-2 py-0.5"
                        style={{
                          fontSize: "11px",
                          background: "var(--color-canvas-muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        📚 {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Agenda notification banner */}
        {pendingAgendaItems && pendingAgendaItems.length > 0 && (
          <div className="self-stretch bg-success-light border border-success rounded-2xl px-4 py-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-success">
                📅 {pendingAgendaItems.length} événement{pendingAgendaItems.length > 1 ? "s" : ""} ajouté{pendingAgendaItems.length > 1 ? "s" : ""} à votre agenda
              </p>
              <button
                onClick={() => setPendingAgendaItems(null)}
                className="text-success hover:opacity-70 text-lg font-bold"
              >×</button>
            </div>
            <ul className="space-y-1">
              {pendingAgendaItems.map((item, i) => (
                <li key={i} className="text-success flex items-center gap-2">
                  <span>{getAgendaIcon(item.type)}</span>
                  <span className="font-medium">{item.titre}</span>
                  <span className="opacity-80">— {item.date}{item.heure ? ` à ${item.heure}` : ""}</span>
                </li>
              ))}
            </ul>
            {parentId && (
              <a
                href={`/dashboard?parentId=${parentId}`}
                className="mt-2 inline-block text-xs text-success underline font-medium"
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
              <div key={contact.id} className="bg-primary-lighter border border-line rounded-2xl px-4 py-3 text-sm">
                {contact.accepte_contact_plateforme ? (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-primary">
                        📨 {contact.prenom} {contact.nom}
                      </p>
                      <p className="text-muted text-xs mt-0.5">{contact.role}</p>
                      {contact.disponibilite && (
                        <p className="text-muted text-xs mt-0.5">Disponible : {contact.disponibilite}</p>
                      )}
                      {contact.sujets_expertise?.length > 0 && (
                        <p className="text-muted text-xs mt-0.5">
                          Expertise : {contact.sujets_expertise.join(", ")}
                        </p>
                      )}
                    </div>
                    {parentId && (
                      <button
                        onClick={() => setContactModalOpen(contact)}
                        className="shrink-0 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        style={{ background: "var(--color-primary)" }}
                      >
                        Envoyer un message
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-primary">
                      📞 {contact.prenom} {contact.nom} — {contact.role}
                    </p>
                    {contact.ecole_rattachee && (
                      <p className="text-muted text-xs mt-0.5">{contact.ecole_rattachee}</p>
                    )}
                    {contact.disponibilite && (
                      <p className="text-muted text-xs mt-0.5">Horaires : {contact.disponibilite}</p>
                    )}
                    {contact.contact_externe?.telephone && (
                      <a href={`tel:${contact.contact_externe.telephone}`} className="block text-primary text-xs mt-0.5 underline">
                        Tél : {contact.contact_externe.telephone}
                      </a>
                    )}
                    {contact.contact_externe?.email && (
                      <a href={`mailto:${contact.contact_externe.email}`} className="block text-primary text-xs mt-0.5 underline">
                        Email : {contact.contact_externe.email}
                      </a>
                    )}
                    {contact.contact_externe?.adresse && (
                      <p className="text-muted text-xs mt-0.5">{contact.contact_externe.adresse}</p>
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => setPendingContacts(null)}
              className="self-end text-xs text-muted hover:text-foreground"
            >
              ✕ Masquer
            </button>
          </div>
        )}

        {/* Community question notification */}
        {communityNotification && (
          <div className="self-stretch bg-canvas-muted border border-line rounded-2xl px-4 py-3 text-sm flex items-start justify-between gap-2">
            <p className="text-foreground">
              📢 Votre question a été posée dans la communauté :{" "}
              <span className="font-semibold">{communityNotification}</span>
            </p>
            <button
              onClick={() => setCommunityNotification(null)}
              className="shrink-0 text-muted hover:text-foreground text-lg font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Quick suggestions — shown only before the first user message */}
        {messages.filter((m) => m.role === "user").length === 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { icon: "📝", label: "Inscrire mon enfant à l'école" },
              { icon: "📅", label: "Vacances scolaires" },
              { icon: "📊", label: "Comprendre le bulletin" },
              { icon: "📚", label: "Aide aux devoirs" },
            ].map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setInput(label);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-line bg-white hover:bg-canvas-muted transition-colors text-foreground"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── File preview ─────────────────────────────────────────────────────── */}
      {selectedFile && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-1 flex items-center gap-2">
          {filePreview === "__pdf__" ? (
            <div className="flex items-center gap-2 h-12 px-3 bg-canvas-soft border border-line rounded-xl">
              <span className="text-xl">📄</span>
              <span className="text-xs text-muted truncate max-w-[180px]">
                {selectedFile.name}
              </span>
            </div>
          ) : filePreview ? (
            <img
              src={filePreview}
              alt="Aperçu"
              className="h-12 w-auto rounded-xl border border-line object-contain bg-white"
            />
          ) : null}
          <button
            type="button"
            onClick={clearFile}
            className="w-5 h-5 bg-muted hover:bg-foreground text-white rounded-full text-xs flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Interim STT text */}
      {interimText && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-1">
          <p className="text-sm text-muted italic px-4 py-1.5 bg-canvas-soft rounded-xl border border-line">
            {interimText}
          </p>
        </div>
      )}

      {/* ── Input form ───────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2.5 px-5 py-4 border-t border-line bg-white max-w-3xl mx-auto w-full"
      >
        {/* Mic button (circle, left) */}
        {hasSTT && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            title={isListening ? "Arrêter la dictée" : "Dicter un message"}
            className={`shrink-0 w-11 h-11 rounded-full text-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
              isListening
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-canvas-muted text-muted hover:bg-canvas-soft hover:text-foreground"
            }`}
          >
            🎙️
          </button>
        )}
        {!hasSTT && !hasTTS && null}

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            isListening
              ? "Parlez maintenant…"
              : selectedFile
              ? "Ajouter un message (optionnel)…"
              : "Tapez votre message… (Entrée pour envoyer)"
          }
          disabled={isLoading}
          className="flex-1 px-5 py-3 rounded-2xl border border-line text-base focus:outline-none focus:ring-2 focus:border-primary-light disabled:opacity-50 disabled:cursor-not-allowed resize-none leading-relaxed"
          style={{
            minHeight: "48px",
            maxHeight: "140px",
            "--tw-ring-color": "var(--color-primary-light)",
          } as React.CSSProperties}
        />

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Envoyer un document (image ou PDF)"
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-canvas-muted transition-colors disabled:opacity-40 text-xl"
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

        {/* Send button (amber when has content, muted when empty) */}
        <button
          type="submit"
          disabled={isLoading || !hasInput}
          title="Envoyer"
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold transition-all disabled:cursor-not-allowed"
          style={{
            background: hasInput && !isLoading ? "var(--color-accent)" : "var(--color-canvas-muted)",
            color: hasInput && !isLoading ? "white" : "var(--color-muted)",
          }}
        >
          ▶
        </button>
      </form>

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-muted px-4 pb-2 bg-white max-w-3xl mx-auto w-full">
        SchoolBridge peut faire des erreurs. Vérifiez les informations importantes auprès de l&apos;école.
      </p>

      {/* ── Notification panel overlay ───────────────────────────────────────── */}
      {notifPanelOpen && urgentPosts.length > 0 && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={() => setNotifPanelOpen(false)}
        >
          {/* Desktop: right drawer */}
          <aside
            className="hidden md:flex flex-col absolute right-0 top-0 h-full bg-white border-l border-line"
            style={{ width: "320px", animation: "slide-in-right 0.25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-display font-bold text-foreground text-base">
                🔔 Messages urgents
              </h2>
              <button
                onClick={() => setNotifPanelOpen(false)}
                className="text-muted hover:text-foreground text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {urgentPosts.map((post) => (
                <NotifPostCard
                  key={post.id}
                  post={post}
                  translated={translatedPosts[post.id]}
                  translating={translatingId === post.id}
                  onTranslate={() => translateUrgentPost(post.id)}
                />
              ))}
            </div>
            <div className="px-5 py-4 border-t border-line flex justify-between items-center">
              {parentId && (
                <a
                  href={`/community?parentId=${parentId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir la communauté →
                </a>
              )}
              <button
                onClick={dismissUrgentBanner}
                className="text-xs text-muted hover:text-foreground"
              >
                Marquer comme lu
              </button>
            </div>
          </aside>

          {/* Mobile: bottom sheet */}
          <aside
            className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-line flex flex-col"
            style={{ height: "60vh", animation: "slide-in-bottom 0.25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-display font-bold text-foreground text-base">
                🔔 Messages urgents
              </h2>
              <button
                onClick={() => setNotifPanelOpen(false)}
                className="text-muted hover:text-foreground text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {urgentPosts.map((post) => (
                <NotifPostCard
                  key={post.id}
                  post={post}
                  translated={translatedPosts[post.id]}
                  translating={translatingId === post.id}
                  onTranslate={() => translateUrgentPost(post.id)}
                />
              ))}
            </div>
            <div className="px-5 py-3 border-t border-line flex justify-between items-center">
              {parentId && (
                <a
                  href={`/community?parentId=${parentId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Voir la communauté →
                </a>
              )}
              <button
                onClick={dismissUrgentBanner}
                className="text-xs text-muted hover:text-foreground"
              >
                Marquer comme lu
              </button>
            </div>
          </aside>
        </div>
      )}

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

      </div>{/* end main chat column */}

      {/* ── xl permanent notification sidebar ───────────────────────────────── */}
      {showXlSidebar && (
        <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-line bg-white overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10">
            <h2 className="font-display font-bold text-foreground text-sm">
              🔔 Messages urgents
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--color-accent)" }}
            >
              {urgentCount}
            </span>
          </div>
          <div className="flex-1 px-4 py-4 flex flex-col gap-3">
            {urgentPosts.map((post) => (
              <NotifPostCard
                key={post.id}
                post={post}
                translated={translatedPosts[post.id]}
                translating={translatingId === post.id}
                onTranslate={() => translateUrgentPost(post.id)}
              />
            ))}
          </div>
          <div className="px-5 py-4 border-t border-line flex justify-between items-center sticky bottom-0 bg-white">
            {parentId && (
              <a
                href={`/community?parentId=${parentId}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Voir la communauté →
              </a>
            )}
            <button
              onClick={dismissUrgentBanner}
              className="text-[10px] text-muted hover:text-foreground"
            >
              Marquer comme lu
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

// ─── Notification Post Card ───────────────────────────────────────────────────

interface NotifPostCardProps {
  post: UrgentPost;
  translated?: string;
  translating: boolean;
  onTranslate: () => void;
}

function NotifPostCard({ post, translated, translating, onTranslate }: NotifPostCardProps) {
  return (
    <div
      className="rounded-xl border border-line bg-canvas-soft p-4 flex flex-col gap-2"
      style={post.epingle ? { borderLeftWidth: "3px", borderLeftColor: "var(--color-accent)" } : {}}
    >
      <div className="flex items-start gap-2">
        {post.epingle && <span className="shrink-0 text-sm mt-0.5">📌</span>}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{post.titre}</p>
          <p className="text-xs text-muted mt-0.5">{post.auteur_nom} · {post.auteur_role}</p>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {translated ?? post.contenu_court}
        {!translated && post.contenu_court.length >= 100 && "…"}
      </p>
      {!translated && (
        <button
          onClick={onTranslate}
          disabled={translating}
          className="self-start text-xs font-medium transition-colors disabled:opacity-50"
          style={{ color: "var(--color-primary-light)" }}
        >
          {translating ? "Traduction…" : "🌐 Traduire"}
        </button>
      )}
    </div>
  );
}
