import Link from "next/link";

// ─── Feature cards data ───────────────────────────────────────────────────────

const features = [
  {
    icon: "🌍",
    title: "Multilingue",
    description:
      "Parlez dans votre langue. L'agent comprend et répond dans cette même langue, sans effort de votre part.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: "📄",
    title: "Documents",
    description:
      "Photographiez une lettre de l'école. L'agent la traduit, l'explique et identifie les actions à faire.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: "👥",
    title: "Communauté",
    description:
      "Connectez-vous avec d'autres parents et les professionnels de l'école. Entraide et informations partagées.",
    accent: "bg-green-50 text-green-600",
  },
  {
    icon: "📅",
    title: "Agenda",
    description:
      "Ne manquez plus aucune date importante. Votre agenda scolaire est mis à jour automatiquement par le chat.",
    accent: "bg-purple-50 text-purple-600",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Top navigation ──────────────────────────────────────────────── */}
      <header className="h-16 flex items-center px-6 md:px-10 border-b border-line bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <span className="font-display font-bold text-primary text-xl flex items-center gap-2">
          🎓 SchoolBridge
        </span>
        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/select"
            className="text-sm text-muted hover:text-foreground transition-colors duration-200 hidden sm:block"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-light transition-all duration-200"
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      {/* ── Hero section ────────────────────────────────────────────────── */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -10%, rgba(27,75,107,0.09) 0%, transparent 70%), linear-gradient(160deg, #E8F4FD 0%, #ffffff 55%)",
        }}
      >
        {/* Subtle decorative blobs */}
        <div
          aria-hidden
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
          style={{ background: "#1B4B6B" }}
        />
        <div
          aria-hidden
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
          style={{ background: "#E8913A" }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Big icon */}
          <div className="text-6xl md:text-7xl mb-6 select-none">🎓</div>

          {/* Title */}
          <h1
            className="font-display font-bold text-4xl md:text-6xl leading-tight mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            SchoolBridge
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-muted font-medium mb-5">
            Votre mentor scolaire intelligent
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-foreground max-w-md mx-auto leading-relaxed mb-10">
            La passerelle entre votre famille et l&apos;école.{" "}
            <span className="text-muted">
              Multilingue. Personnalisé. Toujours disponible.
            </span>
          </p>

          {/* Primary CTA */}
          <Link
            href="/chat?parentId=PAR-001"
            className="inline-flex items-center gap-2.5 text-white font-display font-semibold text-base md:text-lg px-8 md:px-10 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #E8913A 0%, #D17A2A 100%)",
            }}
          >
            <span className="text-lg">▶</span>
            Essayer la démo
          </Link>

          {/* Secondary link */}
          <div className="mt-5">
            <Link
              href="/chat"
              className="text-sm text-muted hover:text-primary transition-colors duration-200 underline underline-offset-4 decoration-muted/40 hover:decoration-primary"
            >
              Ou discuter sans inscription
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              16 langues supportées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Gratuit pendant le hackathon
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Propulsé par Gemini 2.5 Flash
            </span>
          </div>
        </div>
      </section>

      {/* ── Features section ────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 bg-canvas-soft">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted max-w-md mx-auto">
              Un outil complet pour naviguer le système scolaire allemand en toute confiance.
            </p>
          </div>

          {/* 4 feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-line p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${f.accent}`}
                >
                  {f.icon}
                </div>
                {/* Title */}
                <h3 className="font-display font-semibold text-foreground text-base">
                  {f.title}
                </h3>
                {/* Description */}
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── "How it works" mini section ─────────────────────────────────── */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-3">
            Prêt en 30 secondes
          </h2>
          <p className="text-muted mb-10">
            Pas besoin d&apos;installation. Pas d&apos;attente. Ouvrez le chat et posez votre question.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 font-medium text-sm px-6 py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary-lighter transition-all duration-200"
            >
              Créer mon profil
            </Link>
            <Link
              href="/chat?parentId=PAR-001"
              className="flex items-center justify-center gap-2 font-medium text-sm px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              Tester directement →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 bg-canvas-soft border-t border-line">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <span className="font-display font-semibold text-foreground">
            🎓 SchoolBridge
          </span>
          <span>
            Made with{" "}
            <span style={{ color: "var(--color-danger)" }}>❤️</span> at{" "}
            <strong className="text-foreground">IPAI Hackathon 2026</strong> — Heilbronn, Germany
          </span>
          <div className="flex items-center gap-4">
            <Link href="/select" className="hover:text-foreground transition-colors">
              Se connecter
            </Link>
            <Link href="/community" className="hover:text-foreground transition-colors">
              Communauté
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
