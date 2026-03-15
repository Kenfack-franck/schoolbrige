"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ParentSummary {
  id: string;
  prenom: string;
  nom: string;
  langue_maternelle: string;
  pays_origine: string;
  nombre_enfants: number;
  enfants_prenoms: string[];
}

export default function SelectPage() {
  const router = useRouter();
  const [parents, setParents] = useState<ParentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parents")
      .then((r) => r.json())
      .then((data) => {
        setParents(data as ParentSummary[]);
        setLoading(false);
      })
      .catch(() => {
        setError("Impossible de charger la liste des parents.");
        setLoading(false);
      });
  }, []);

  function handleCardClick(parentId: string) {
    setExpandedId((prev) => (prev === parentId ? null : parentId));
  }

  return (
    <main className="min-h-screen bg-canvas-soft">
      {/* Header */}
      <header className="h-14 bg-white border-b border-line px-6 flex items-center gap-4">
        <Link
          href="/"
          className="font-display font-bold text-primary text-lg flex items-center gap-2 hover:text-primary-light transition-colors"
        >
          🎓 SchoolBridge
        </Link>
        <Link href="/" className="ml-auto text-sm text-muted hover:text-foreground transition-colors">
          ← Accueil
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">Qui êtes-vous ?</h2>
        <p className="text-muted mb-6">Cliquez sur votre nom pour accéder à votre espace.</p>

        {loading && (
          <div className="text-center text-muted py-12">Chargement...</div>
        )}
        {error && (
          <div className="text-danger bg-danger-light border border-danger rounded-xl p-4">{error}</div>
        )}

        {/* Parents list */}
        <div className="flex flex-col gap-3">
          {parents.map((p) => (
            <div
                key={p.id}
                className="bg-white border border-line rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
              {/* Parent card header */}
              <button
                onClick={() => handleCardClick(p.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between transition-all duration-200 hover:bg-canvas-soft"
              >
                <div>
                  <p className="font-display font-semibold text-foreground text-lg">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-muted">
                    {p.langue_maternelle} · {p.pays_origine}
                    {p.enfants_prenoms.length > 0 && ` · ${p.enfants_prenoms.join(", ")}`}
                  </p>
                </div>
                <span className={`text-muted transition-transform duration-200 ${expandedId === p.id ? "rotate-90" : ""}`}>
                  ▶
                </span>
              </button>

              {/* Expanded action buttons */}
              {expandedId === p.id && (
                <div className="border-t border-line px-5 py-4 flex flex-col sm:flex-row gap-3 bg-canvas-soft">
                  <button
                    onClick={() => router.push(`/chat?parentId=${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
                    style={{ background: "var(--color-primary)" }}
                  >
                    <span>💬</span>
                    <span>Discuter</span>
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard?parentId=${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-line text-foreground px-4 py-3 rounded-xl font-semibold text-sm hover:bg-canvas-soft transition-all duration-200"
                  >
                    <span>📊</span>
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => router.push(`/community?parentId=${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-line text-foreground px-4 py-3 rounded-xl font-semibold text-sm hover:bg-canvas-soft transition-all duration-200"
                  >
                    <span>👥</span>
                    <span>Communauté</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
