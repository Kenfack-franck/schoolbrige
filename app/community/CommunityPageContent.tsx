"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import CommunityPost, { CommunityPostData } from "@/components/CommunityPost";
import NavBar from "@/components/NavBar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParentInfo {
  prenom: string;
  nom: string;
  enfants: { nom_ecole: string }[];
}

// ─── Inline Composer ──────────────────────────────────────────────────────────

interface InlineComposerProps {
  parentId: string;
  parentInfo: ParentInfo | null;
  activeTab: "ecole" | "general";
  onPublished: (post: CommunityPostData) => void;
}

function getInitials(prenom: string, nom: string): string {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

function InlineComposer({ parentId, parentInfo, activeTab, onPublished }: InlineComposerProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [type, setType] = useState<"information" | "question" | "evenement">("information");
  const [imageFile, setImageFile] = useState<{ file: File; preview: string } | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [showEventDate, setShowEventDate] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = parentInfo ? getInitials(parentInfo.prenom, parentInfo.nom) : "?";
  const prenom = parentInfo?.prenom ?? "you";

  const canPublish = text.trim().length > 0 && !publishing;

  // Auto-detect ecole_cible
  const ecoleCible =
    activeTab === "ecole" && parentInfo?.enfants[0]?.nom_ecole
      ? parentInfo.enfants[0].nom_ecole
      : null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Clean up previous preview URL
    if (imageFile) URL.revokeObjectURL(imageFile.preview);
    setImageFile({ file, preview: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function removeImage() {
    if (imageFile) URL.revokeObjectURL(imageFile.preview);
    setImageFile(null);
  }

  function toggleEventDate() {
    setShowEventDate((v) => !v);
    if (!showEventDate) setType("evenement");
    else { setType("information"); setEventDate(""); }
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          titre: text.trim().slice(0, 80),
          contenu: text.trim(),
          type: showEventDate ? "evenement" : type,
          ecole_cible: ecoleCible,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { post?: CommunityPostData };
        if (data.post) onPublished(data.post);
        // Reset
        setText("");
        setType("information");
        setFocused(false);
        setShowEventDate(false);
        setEventDate("");
        removeImage();
      }
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  }

  const TYPE_OPTIONS: { value: "information" | "question" | "evenement"; label: string }[] = [
    { value: "information", label: "ℹ️ Info" },
    { value: "question", label: "❓ Question" },
    { value: "evenement", label: "🎉 Event" },
  ];

  return (
    <form
      onSubmit={handlePublish}
      className="bg-white border border-line rounded-2xl p-4 flex flex-col gap-3"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
    >
      {/* Row 1: avatar + textarea */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mt-0.5"
          style={{ background: "#E8913A" }}
        >
          {initials}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { if (!text.trim()) setFocused(false); }}
            placeholder={`Write something, ${prenom}…`}
            rows={focused ? 4 : 1}
            className="w-full resize-none rounded-xl border border-line bg-canvas-soft px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
            style={{ lineHeight: "1.5" }}
          />
          {/* Emoji decoration */}
          <span className="absolute right-3 top-2.5 text-base pointer-events-none select-none opacity-50">
            😊
          </span>
        </div>
      </div>

      {/* Image preview */}
      {imageFile && (
        <div className="ml-[52px] relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFile.preview}
            alt="Preview"
            className="max-h-32 rounded-xl border border-line object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-white rounded-full text-xs flex items-center justify-center leading-none hover:bg-danger transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Event date field */}
      {showEventDate && (
        <div className="ml-[52px]">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>
      )}

      {/* Type badges — shown when focused or text present */}
      {(focused || text.trim()) && !showEventDate && (
        <div className="ml-[52px] flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                type === opt.value
                  ? "text-white border-transparent"
                  : "text-muted border-line bg-white hover:bg-canvas-muted"
              }`}
              style={
                type === opt.value
                  ? { background: "var(--color-primary)" }
                  : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Row 2: action buttons + publish */}
      <div className="ml-[52px] flex items-center gap-1">
        {/* Attach */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground hover:bg-canvas-muted px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>Attach</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Event date toggle */}
        <button
          type="button"
          onClick={toggleEventDate}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            showEventDate
              ? "text-primary bg-primary-lighter"
              : "text-muted hover:text-foreground hover:bg-canvas-muted"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Event</span>
        </button>

        {/* Mention — decorative MVP */}
        <button
          type="button"
          title="Coming soon"
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground hover:bg-canvas-muted px-2.5 py-1.5 rounded-lg transition-colors opacity-50 cursor-default"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Mention</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Publish button */}
        <button
          type="submit"
          disabled={!canPublish}
          className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canPublish ? "var(--color-accent)" : undefined }}
        >
          {publishing ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Posting…
            </span>
          ) : "Post"}
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommunityPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  const [activeTab, setActiveTab] = useState<"ecole" | "general">(parentId ? "ecole" : "general");
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    setPosts([]);
    const url = parentId
      ? `/api/community?parentId=${parentId}&filter=${activeTab}`
      : `/api/community?filter=general`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { posts?: CommunityPostData[] };
        setPosts(d.posts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [parentId, activeTab]);

  // Fetch parent info for the composer avatar/name
  useEffect(() => {
    if (!parentId) return;
    fetch(`/api/parents/${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { parent?: { prenom: string; nom: string }; enfants?: { nom_ecole: string }[] };
        if (d.parent) {
          setParentInfo({
            prenom: d.parent.prenom,
            nom: d.parent.nom,
            enfants: d.enfants ?? [],
          });
        }
      })
      .catch(() => {/* ignore */});
  }, [parentId]);

  function handleNewPost(post: CommunityPostData) {
    setPosts((prev) => [post, ...prev]);
  }

  // ─── Partition posts ────────────────────────────────────────────────────────

  const pinned = posts.filter((p) => p.epingle);
  const unpinned = posts
    .filter((p) => !p.epingle)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-canvas-soft">
      <NavBar parentId={parentId} activePage="community" />

      {/* Header */}
      <div className="bg-white border-b border-line px-6 py-3">
        <h1 className="font-display font-bold text-lg text-foreground">Community</h1>
        <p className="text-xs text-muted">Exchanges between parents and school</p>
      </div>

      {/* Main content area */}
      <div className="max-w-5xl mx-auto px-4 py-4 pb-20">
        {/* Tabs */}
        <div className="flex items-center mb-5">
          <div
            className="flex gap-1 bg-white border border-line rounded-xl p-1"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {parentId && (
              <button
                onClick={() => setActiveTab("ecole")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "ecole"
                    ? "text-white shadow-sm"
                    : "text-muted hover:bg-canvas-muted"
                }`}
                style={activeTab === "ecole" ? { background: "var(--color-primary)" } : {}}
              >
                🏫 School
              </button>
            )}
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "general"
                  ? "text-white shadow-sm"
                  : "text-muted hover:bg-canvas-muted"
              }`}
              style={activeTab === "general" ? { background: "var(--color-primary)" } : {}}
            >
              🌐 General
            </button>
          </div>
        </div>

        {/* ── Inline composer — only for authenticated users ── */}
        {parentId ? (
          <div className="mb-6">
            <InlineComposer
              parentId={parentId}
              parentInfo={parentInfo}
              activeTab={activeTab}
              onPublished={handleNewPost}
            />
          </div>
        ) : (
          <div className="mb-6 bg-white border border-line rounded-2xl px-5 py-4 text-center text-sm text-muted">
            <a href="/select" className="text-primary font-medium hover:underline">Log in</a>
            {" "}to post in the community.
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center text-muted py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted py-16">
            <p className="text-base mb-1">No posts to display.</p>
            {parentId && activeTab === "ecole" && (
              <p className="text-sm">No posts for your school yet.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* ── Pinned posts — above the masonry grid, full width ── */}
            {pinned.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-display font-semibold text-amber-600 uppercase tracking-wide">
                    📌 Important
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {pinned.length}
                  </span>
                  <div className="flex-1 h-px bg-amber-200" />
                </div>
                <div
                  className={`grid gap-3 ${
                    pinned.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {pinned.map((post) => (
                    <CommunityPost key={post.id} post={post} parentId={parentId} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Masonry grid of all other posts ── */}
            {unpinned.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">
                      All posts
                    </span>
                    <span className="text-[10px] bg-canvas-muted text-muted px-2 py-0.5 rounded-full font-medium">
                      {unpinned.length}
                    </span>
                    <div className="flex-1 h-px bg-line" />
                  </div>
                )}

                {/*
                  CSS columns masonry — each card gets break-inside-avoid + mb-4.
                  Note: when cards expand (comments), the column layout re-flows,
                  which can cause cards to jump columns — known CSS columns trade-off.
                */}
                <div
                  className="columns-1 sm:columns-2 lg:columns-3"
                  style={{ columnGap: "1rem" }}
                >
                  {unpinned.map((post) => (
                    <CommunityPost
                      key={post.id}
                      post={post}
                      parentId={parentId}
                      className="break-inside-avoid mb-4"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
