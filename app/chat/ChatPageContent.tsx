"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";

interface ProfileMeta {
  parentNom: string;
  enfantsPrenoms: string[];
}

export default function ChatPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");
  const isIdentified = parentId !== null;

  const [meta, setMeta] = useState<ProfileMeta | null>(null);

  // Load parent/children names for the header
  useEffect(() => {
    if (!isIdentified || !parentId) return;
    fetch(`/api/parents/${parentId}`)
      .then((r) => r.json())
      .then((data) => {
        const parent = data.parent;
        const enfants: { prenom: string }[] = data.enfants ?? [];
        if (parent) {
          setMeta({
            parentNom: `${parent.prenom} ${parent.nom}`,
            enfantsPrenoms: enfants.map((e) => e.prenom),
          });
        }
      })
      .catch(() => {});
  }, [parentId, isIdentified]);

  const headerSubtitle = isIdentified
    ? meta
      ? `${meta.parentNom}${meta.enfantsPrenoms.length > 0 ? ` — ${meta.enfantsPrenoms.join(", ")}` : ""}`
      : "Chargement du profil..."
    : "Discussion libre";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-4 shrink-0">
        <Link
          href="/"
          className="text-white hover:text-blue-200 transition-colors text-sm font-medium whitespace-nowrap"
        >
          ← Accueil
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">SchoolBridge</h1>
          <p className="text-xs text-blue-200 truncate">{headerSubtitle}</p>
        </div>
        {isIdentified && parentId && (
          <Link
            href={`/dashboard?parentId=${parentId}`}
            className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            📊 Dashboard
          </Link>
        )}
      </header>

      {/* Chat */}
      <ChatInterface parentId={parentId} />
    </main>
  );
}
