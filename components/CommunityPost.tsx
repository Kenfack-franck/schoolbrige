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

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPost({ post, parentId, onAgendaAdd }: CommunityPostProps) {
  const [expanded, setExpanded] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [agendaAdded, setAgendaAdded] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(parentId ? post.liked_by.includes(parentId) : false);
  const [comments, setComments] = useState<Comment[]>(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const avatarColor = getAvatarColor(post.auteur_role);
  const initials = getInitials(post.auteur_nom);
  const isAuteurContact = post.auteur_id !== null && post.auteur_id.startsWith("PR-");
  const isEvent = post.type === "evenement";
  const displayContent = translatedContent ?? post.contenu;
  const dotColor = getTypeDot(post.type);

  async function handleTranslate() {
    setTranslating(true);
    try {
      const res = await fetch("/api/community/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, targetLang: "Français" }),
      });
      const data = (await res.json()) as { translated?: string };
      if (data.translated) {
        setTranslatedContent(data.translated);
        if (!expanded) setExpanded(true);
      }
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
      // optimistic update
      setLiked(prev => !prev);
      setLikes(prev => liked ? prev - 1 : prev + 1);
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
        setComments(prev => [...prev, data.comment!]);
        setCommentText("");
      }
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        post.epingle
          ? "border-l-4 border-accent"
          : "border-line"
      }`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* Image */}
      {post.image && (
        <div className="w-full h-40 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/community-images/${post.image}`}
            alt={post.titre}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Compact header — always visible */}
      <div
        className="px-5 pt-4 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Author + meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-foreground leading-tight">
                {post.auteur_nom}
              </span>
              {post.epingle && (
                <span className="text-xs text-accent font-bold">📌</span>
              )}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${dotColor}18`, color: dotColor }}
              >
                {getTypeLabel(post.type)}
              </span>
              <span className="text-xs text-muted ml-auto shrink-0">{formatDate(post.date)}</span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-foreground mt-1 leading-snug line-clamp-2">
              {post.titre}
            </p>

            {/* Preview snippet when collapsed */}
            {!expanded && (
              <p className="text-sm text-muted mt-1 leading-relaxed line-clamp-2">
                {displayContent.slice(0, 140)}…
              </p>
            )}
          </div>

          {/* Expand chevron */}
          <span
            className="text-muted text-sm shrink-0 mt-1 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-5 pb-4 flex flex-col gap-3">
          {/* Full content */}
          <div className="text-base text-foreground leading-relaxed">
            <p className="whitespace-pre-wrap">{displayContent}</p>
            {translatedContent && (
              <p className="text-sm text-muted mt-1 italic">Translated from {post.langue_originale}</p>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-canvas-muted text-muted px-2.5 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {post.langue_originale !== "Français" && !translatedContent && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="text-sm bg-canvas-muted text-foreground hover:bg-line px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {translating ? "Translating..." : "🌐 Translate"}
              </button>
            )}
            {isEvent && parentId && (
              <button
                onClick={handleAgendaAdd}
                disabled={agendaAdded}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                  agendaAdded
                    ? "bg-green-100 text-green-700 cursor-default"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {agendaAdded ? "✅ Added" : "📅 Add to agenda"}
              </button>
            )}
            {isAuteurContact && parentId && (
              <a
                href={`/dashboard?parentId=${parentId}`}
                className="text-sm bg-primary-lighter text-primary px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80"
              >
                📨 Contact
              </a>
            )}
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="flex flex-col gap-2.5 border-t border-line pt-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: getAvatarColor("Parent") }}
                  >
                    {getInitials(c.auteur_nom)}
                  </div>
                  <div className="flex-1 bg-canvas-muted rounded-xl px-3 py-2">
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
                    className="flex-1 border border-line rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-colors"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {submittingComment ? "..." : "Send"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Social footer — always visible */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-line">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!parentId}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            liked ? "text-accent" : "text-muted hover:text-accent"
          }`}
        >
          <span>{liked ? "❤️" : "🤍"}</span>
          <span>{likes}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(c => !c)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            showComments ? "text-primary" : "text-muted hover:text-primary"
          }`}
        >
          <span>💬</span>
          <span>{comments.length}</span>
        </button>

        {/* Language badge */}
        {post.langue_originale !== "Français" && !translatedContent && (
          <span className="text-xs text-muted bg-canvas-muted px-2.5 py-0.5 rounded-full">
            {post.langue_originale}
          </span>
        )}

        {/* School badge */}
        {post.auteur_ecole && (
          <span className="ml-auto text-xs text-muted truncate max-w-[160px]">
            📍 {post.auteur_ecole.replace("Friedrich-Schiller-Gymnasium", "FSG").replace(" Heilbronn", "")}
          </span>
        )}
      </div>
    </div>
  );
}
