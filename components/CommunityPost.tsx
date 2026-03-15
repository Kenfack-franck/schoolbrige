"use client";

import { useState } from "react";
import type { Comment } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityPostData {
  id: string;
  auteur_id: string | null;
  auteur_nom: string;
  auteur_role: string;
  auteur_ecole: string | null;
  type: "annonce_officielle" | "information" | "evenement" | "question";
  ecole_cible: string | null;
  date: string;
  titre: string;
  contenu: string;
  langue_originale: string;
  epingle: boolean;
  tags: string[];
  image: string | null;
  likes: number;
  liked_by: string[];
  comments: Comment[];
}

interface CommunityPostProps {
  post: CommunityPostData;
  parentId?: string | null;
  onAgendaAdd?: (item: { titre: string; date: string; type: string }) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nom: string): string {
  return nom
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(role: string): string {
  if (role.includes("Direction")) return "#C43E3E";
  if (role.includes("Secrétariat")) return "#2A6F97";
  if (role.includes("Enseignant")) return "#2A6F97";
  if (role.includes("Conseiller")) return "#9B59B6";
  if (role.includes("Médiateur") || role.includes("Médiatrice")) return "#2D8A56";
  if (role.includes("Institution")) return "#0F5257";
  if (role.includes("Parent")) return "#E8913A";
  return "#6B7280";
}

function getTypeLabel(type: CommunityPostData["type"]): string {
  const labels: Record<CommunityPostData["type"], string> = {
    annonce_officielle: "Announcement",
    information: "Info",
    evenement: "Event",
    question: "Question",
  };
  return labels[type];
}

function getTypeDot(type: CommunityPostData["type"]): string {
  const colors: Record<CommunityPostData["type"], string> = {
    annonce_officielle: "#C43E3E",
    information: "#2A6F97",
    evenement: "#9B59B6",
    question: "#E8913A",
  };
  return colors[type];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff > -7 && diff < 0) return `${Math.abs(diff)} days ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const CONTENT_LIMIT = 150;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPost({ post, parentId, onAgendaAdd, className = "" }: CommunityPostProps) {
  const [textExpanded, setTextExpanded] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [agendaAdded, setAgendaAdded] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(parentId ? post.liked_by.includes(parentId) : false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imgError, setImgError] = useState(false);

  const avatarColor = getAvatarColor(post.auteur_role);
  const initials = getInitials(post.auteur_nom);
  const isAuteurContact = post.auteur_id !== null && post.auteur_id.startsWith("PR-");
  const isEvent = post.type === "evenement";
  const displayContent = translatedContent ?? post.contenu;
  const dotColor = getTypeDot(post.type);
  const isLong = displayContent.length > CONTENT_LIMIT;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleTranslate() {
    setTranslating(true);
    try {
      const res = await fetch("/api/community/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, targetLang: "Français" }),
      });
      const data = (await res.json()) as { translated?: string };
      if (data.translated) setTranslatedContent(data.translated);
    } catch {
      // ignore
    } finally {
      setTranslating(false);
    }
  }

  async function handleAgendaAdd() {
    if (!parentId || agendaAdded) return;
    try {
      await fetch(`/api/agenda/${parentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            titre: post.titre,
            date: post.date,
            heure: null,
            type: "evenement",
            source: "Community",
            description: post.contenu.slice(0, 200),
            enfant_concerne: null,
            lieu: null,
          }],
        }),
      });
      setAgendaAdded(true);
      onAgendaAdd?.({ titre: post.titre, date: post.date, type: "evenement" });
    } catch {
      // ignore
    }
  }

  async function handleLike() {
    if (!parentId) return;
    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, parentId }),
      });
      const data = (await res.json()) as { likes?: number; liked?: boolean };
      if (typeof data.likes === "number") {
        setLikes(data.likes);
        setLiked(data.liked ?? false);
      }
    } catch {
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/community/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, parentId, contenu: commentText.trim() }),
      });
      const data = (await res.json()) as { comment?: Comment };
      if (data.comment) {
        setComments((prev) => [...prev, data.comment!]);
        setCommentText("");
      }
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // Pinned: 4px amber left border + 1px line on other sides
  // Regular: 1px border-line all sides
  const cardBorder = post.epingle
    ? "border border-line border-l-4 border-l-amber-400"
    : "border border-line";

  const cardBg = post.epingle ? "bg-amber-50/30" : "bg-white";

  return (
    <div
      className={`${cardBg} ${cardBorder} rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${className}`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      {post.image && !imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/community-images/${post.image}`}
          alt={post.titre}
          className="w-full h-auto block"
          onError={() => setImgError(true)}
        />
      ) : post.image && imgError ? (
        <div
          className="w-full flex items-center justify-center text-3xl"
          style={{
            height: 160,
            background: "linear-gradient(135deg, #EBF4FB 0%, #D6EAF8 100%)",
          }}
        >
          🖼️
        </div>
      ) : null}

      {/* ── Author header ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{post.auteur_nom}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: `${dotColor}18`, color: dotColor }}
            >
              {getTypeLabel(post.type)}
            </span>
            <span className="text-xs text-muted">{formatDate(post.date)}</span>
          </div>
        </div>
        {post.epingle && <span className="text-amber-500 text-sm shrink-0">📌</span>}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex flex-col gap-2">
        {/* Title */}
        {post.titre && (
          <p className="text-sm font-semibold text-foreground leading-snug">{post.titre}</p>
        )}

        {/* Body text with expand */}
        <div className="text-sm text-foreground leading-relaxed">
          {!isLong || textExpanded ? (
            <span className="whitespace-pre-wrap">{displayContent}</span>
          ) : (
            <>
              <span>{displayContent.slice(0, CONTENT_LIMIT)}</span>
              <button
                onClick={() => setTextExpanded(true)}
                className="text-primary font-medium ml-0.5 hover:underline"
              >
                … See more
              </button>
            </>
          )}
          {textExpanded && isLong && (
            <button
              onClick={() => setTextExpanded(false)}
              className="block text-primary font-medium mt-1 text-xs hover:underline"
            >
              See less
            </button>
          )}
        </div>

        {translatedContent && (
          <p className="text-xs text-muted italic">Translated from {post.langue_originale}</p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs bg-canvas-muted text-muted px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Utility action buttons */}
        {(post.langue_originale !== "Français" || (isEvent && parentId) || (isAuteurContact && parentId)) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.langue_originale !== "Français" && !translatedContent && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="text-xs text-muted hover:text-primary border border-line rounded-full px-2.5 py-1 transition-colors disabled:opacity-50 bg-white"
              >
                {translating ? "⏳" : "🌐"} {translating ? "Translating..." : "Translate"}
              </button>
            )}
            {isEvent && parentId && (
              <button
                onClick={handleAgendaAdd}
                disabled={agendaAdded}
                className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                  agendaAdded
                    ? "border-green-200 text-green-700 bg-green-50 cursor-default"
                    : "border-line text-muted hover:text-green-700 hover:border-green-300 bg-white"
                }`}
              >
                {agendaAdded ? "✅ Added" : "📅 Add to agenda"}
              </button>
            )}
            {isAuteurContact && parentId && (
              <a
                href={`/dashboard?parentId=${parentId}`}
                className="text-xs text-muted hover:text-primary border border-line rounded-full px-2.5 py-1 transition-colors bg-white"
              >
                📨 Contact
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── Social footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center px-4 py-2.5 border-t border-line gap-5">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!parentId}
          className={`flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
            liked ? "text-red-500" : "text-muted hover:text-red-400"
          }`}
        >
          <span className="text-base leading-none">{liked ? "❤️" : "🤍"}</span>
          <span className="text-xs font-medium">{likes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((c) => !c)}
          className={`flex items-center gap-1.5 transition-colors ${
            showComments ? "text-primary" : "text-muted hover:text-primary"
          }`}
        >
          <span className="text-base leading-none">💬</span>
          <span className="text-xs font-medium">{comments.length}</span>
        </button>

        {/* Share — visual only */}
        <button className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors ml-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs font-medium">Share</span>
        </button>

        {/* School badge */}
        {post.auteur_ecole && (
          <span className="text-xs text-muted truncate max-w-[120px] hidden sm:block">
            📍 {post.auteur_ecole.replace("Friedrich-Schiller-Gymnasium", "FSG").replace(" Heilbronn", "")}
          </span>
        )}
      </div>

      {/* ── Comments section ──────────────────────────────────────────────── */}
      {showComments && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-line pt-3">
          {comments.length === 0 && (
            <p className="text-xs text-muted text-center py-1">No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: getAvatarColor("Parent") }}
              >
                {getInitials(c.auteur_nom)}
              </div>
              <div className="flex-1 bg-canvas-soft rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{c.auteur_nom}</p>
                <p className="text-sm text-foreground leading-relaxed">{c.contenu}</p>
                <p className="text-xs text-muted mt-0.5">{formatDate(c.date)}</p>
              </div>
            </div>
          ))}

          {parentId && (
            <form onSubmit={handleComment} className="flex gap-2 mt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="shrink-0 text-sm font-semibold px-3 py-2 rounded-xl text-white disabled:opacity-40 transition-colors"
                style={{ background: "var(--color-primary)" }}
              >
                {submittingComment ? "…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
