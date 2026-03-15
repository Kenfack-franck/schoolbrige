"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CommunityPost, { CommunityPostData } from "@/components/CommunityPost";
import NavBar from "@/components/NavBar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isInstitutional(post: CommunityPostData): boolean {
  return ["annonce_officielle", "evenement"].includes(post.type) ||
    ["Direction", "Secrétariat", "Enseignante", "Enseignant", "Conseiller d'orientation", "Bot"].includes(post.auteur_role);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommunityPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  const [activeTab, setActiveTab] = useState<"ecole" | "general">(parentId ? "ecole" : "general");
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [loading, setLoading] = useState(true);

  // Publish modal
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishContent, setPublishContent] = useState("");
  const [publishType, setPublishType] = useState<"information" | "question" | "evenement">("information");
  const [publishing, setPublishing] = useState(false);

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

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !publishTitle.trim() || !publishContent.trim()) return;

    setPublishing(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          titre: publishTitle.trim(),
          contenu: publishContent.trim(),
          type: publishType,
          ecole_cible: null,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { post?: CommunityPostData };
        if (data.post) setPosts((prev) => [data.post!, ...prev]);
        setPublishOpen(false);
        setPublishTitle("");
        setPublishContent("");
        setPublishType("information");
      }
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  }

  // ─── Partition posts ────────────────────────────────────────────────────────

  const pinned = posts.filter((p) => p.epingle);
  const unpinned = posts.filter((p) => !p.epingle);

  // For "Général" tab: institutional vs community
  const institutionalPosts = unpinned.filter(isInstitutional);
  const communityPosts = unpinned.filter((p) => !isInstitutional(p));

  // ─── Section component ──────────────────────────────────────────────────────

  function SectionLabel({ label, count }: { label: string; count: number }) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">{label}</span>
        <span className="text-[10px] bg-canvas-muted text-muted px-2 py-0.5 rounded-full font-medium">{count}</span>
        <div className="flex-1 h-px bg-line" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-canvas-soft">
      <NavBar parentId={parentId} activePage="community" />

      {/* Header */}
      <div className="bg-white border-b border-line px-6 py-3">
        <h1 className="font-display font-bold text-lg text-foreground">Communauté</h1>
        <p className="text-xs text-muted">Échanges entre parents et l&apos;école</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20 md:pb-8">
        {/* Tabs + Publish */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white border border-line rounded-xl p-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
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
                🏫 École
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
              🌐 Général
            </button>
          </div>

          {parentId && (
            <button
              onClick={() => setPublishOpen(true)}
              className="text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
              style={{ background: "var(--color-accent)" }}
            >
              ✏️ Publier
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-muted py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted py-16">
            <p className="text-base mb-1">Aucun message à afficher.</p>
            {parentId && activeTab === "ecole" && (
              <p className="text-sm">Pas encore de messages pour votre école.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* ─── École tab ─── */}
            {activeTab === "ecole" && (
              <>
                {pinned.length > 0 && (
                  <div>
                    <SectionLabel label="Épinglés" count={pinned.length} />
                    <div className="flex flex-col gap-3">
                      {pinned.map((post) => (
                        <CommunityPost key={post.id} post={post} parentId={parentId} />
                      ))}
                    </div>
                  </div>
                )}
                {unpinned.length > 0 && (
                  <div>
                    {pinned.length > 0 && <SectionLabel label="Autres messages" count={unpinned.length} />}
                    <div className="flex flex-col gap-3">
                      {unpinned.map((post) => (
                        <CommunityPost key={post.id} post={post} parentId={parentId} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── Général tab ─── */}
            {activeTab === "general" && (
              <>
                {pinned.length > 0 && (
                  <div>
                    <SectionLabel label="Épinglés" count={pinned.length} />
                    <div className="flex flex-col gap-3">
                      {pinned.map((post) => (
                        <CommunityPost key={post.id} post={post} parentId={parentId} />
                      ))}
                    </div>
                  </div>
                )}
                {institutionalPosts.length > 0 && (
                  <div>
                    <SectionLabel label="Infos école & institutions" count={institutionalPosts.length} />
                    <div className="flex flex-col gap-3">
                      {institutionalPosts.map((post) => (
                        <CommunityPost key={post.id} post={post} parentId={parentId} />
                      ))}
                    </div>
                  </div>
                )}
                {communityPosts.length > 0 && (
                  <div>
                    <SectionLabel label="Entraide entre parents" count={communityPosts.length} />
                    <div className="flex flex-col gap-3">
                      {communityPosts.map((post) => (
                        <CommunityPost key={post.id} post={post} parentId={parentId} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Publish modal */}
      {publishOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display font-bold text-foreground">Publier un message</h2>
              <button
                onClick={() => setPublishOpen(false)}
                className="text-muted hover:text-foreground text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePublish} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1 block">
                  Type
                </label>
                <select
                  value={publishType}
                  onChange={(e) => setPublishType(e.target.value as "information" | "question" | "evenement")}
                  className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="information">ℹ️ Information</option>
                  <option value="question">❓ Question</option>
                  <option value="evenement">🎉 Événement</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1 block">
                  Titre
                </label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="Titre de votre message..."
                  required
                  className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted font-medium uppercase tracking-wide mb-1 block">
                  Contenu
                </label>
                <textarea
                  value={publishContent}
                  onChange={(e) => setPublishContent(e.target.value)}
                  placeholder="Votre message..."
                  required
                  rows={5}
                  className="w-full border border-line rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPublishOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-muted hover:bg-canvas-muted transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{ background: "var(--color-primary)" }}
                >
                  {publishing ? "Publication..." : "Publier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
