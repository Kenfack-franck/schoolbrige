import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🏫</div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">SchoolBridge</h1>
        <p className="text-lg text-slate-500">Votre mentor scolaire intelligent</p>
      </div>

      {/* 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Card 1 — Déjà inscrit */}
        <Link
          href="/select"
          className="group bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            Je suis déjà inscrit
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Accédez à votre profil personnalisé et continuez avec votre mentor.
          </p>
        </Link>

        {/* Card 2 — S'inscrire */}
        <Link
          href="/register"
          className="group bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center hover:border-green-400 hover:shadow-md transition-all"
        >
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-green-600 transition-colors">
            Je m&apos;inscris
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Créez votre profil pour des réponses personnalisées à votre situation.
          </p>
        </Link>

        {/* Card 3 — Chat libre */}
        <Link
          href="/chat"
          className="group bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center hover:border-purple-400 hover:shadow-md transition-all"
        >
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
            Je veux juste discuter
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Posez vos questions sans vous inscrire, dans votre langue.
          </p>
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400 text-center">
        IPAI Hackathon 2026 · Heilbronn · AI-Powered Parent Mentoring
      </p>
    </main>
  );
}
