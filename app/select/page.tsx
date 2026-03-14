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
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white hover:text-blue-200 transition-colors text-sm font-medium">
          ← Accueil
        </Link>
        <div>
          <h1 className="text-xl font-bold">SchoolBridge</h1>
          <p className="text-xs text-blue-200">Sélectionnez votre profil</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Qui êtes-vous ?</h2>
        <p className="text-slate-500 mb-6">Cliquez sur votre nom pour accéder à votre espace.</p>

        {loading && (
          <div className="text-center text-slate-400 py-12">Chargement...</div>
        )}
        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>
        )}

        {/* Parents list */}
        <div className="flex flex-col gap-3">
          {parents.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Parent card header */}
              <button
                onClick={() => handleCardClick(p.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between transition-all hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-800 text-lg">
                    {p.prenom} {p.nom}
                  </p>
                  <p className="text-sm text-slate-500">
                    {p.langue_maternelle} · {p.pays_origine}
                    {p.enfants_prenoms.length > 0 && ` · ${p.enfants_prenoms.join(", ")}`}
                  </p>
                </div>
                <span className={`text-slate-400 transition-transform ${expandedId === p.id ? "rotate-90" : ""}`}>
                  ▶
                </span>
              </button>

              {/* Expanded action buttons */}
              {expandedId === p.id && (
                <div className="border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row gap-3 bg-slate-50">
                  <button
                    onClick={() => router.push(`/chat?parentId=${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    <span>💬</span>
                    <span>Discuter avec SchoolBridge</span>
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard?parentId=${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-blue-300 text-blue-700 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
                  >
                    <span>📊</span>
                    <span>Voir mon dashboard</span>
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
