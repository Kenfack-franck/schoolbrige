import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "🌍",
    title: "Multilingue natif",
    description: "Parlez dans votre langue. L'agent comprend et répond sans effort — turc, arabe, ukrainien et 13 autres langues.",
    accent: "#EBF4FB",
    iconBg: "#1B4B6B",
  },
  {
    icon: "📄",
    title: "Lisez vos courriers",
    description: "Photographiez une lettre de l'école. L'agent la traduit, l'explique et identifie les actions à faire.",
    accent: "#FEF3E8",
    iconBg: "#E8913A",
  },
  {
    icon: "👥",
    title: "Communauté active",
    description: "Connectez-vous avec d'autres parents et professionnels de l'école. Entraide et informations partagées.",
    accent: "#EDFAF3",
    iconBg: "#2D8A56",
  },
  {
    icon: "📅",
    title: "Agenda intelligent",
    description: "Ne manquez plus aucune date. Votre agenda scolaire est mis à jour automatiquement pendant le chat.",
    accent: "#F3EDFB",
    iconBg: "#9B59B6",
  },
];

const steps = [
  {
    num: "1",
    title: "Créez votre profil",
    desc: "30 secondes. Votre langue, vos enfants, votre école.",
    icon: "✍️",
  },
  {
    num: "2",
    title: "Posez vos questions",
    desc: "Dans votre langue. L'agent comprend et répond avec des sources officielles.",
    icon: "💬",
  },
  {
    num: "3",
    title: "Agissez en confiance",
    desc: "Agenda, contacts, documents — tout est organisé pour vous.",
    icon: "✅",
  },
];

const testimonials = [
  {
    quote: "J'ai enfin compris le bulletin de notes de mon fils. L'agent me l'a expliqué en turc, avec tous les détails.",
    name: "Fatma Y.",
    role: "Mère de 2 enfants · Heilbronn",
    flag: "🇹🇷",
    color: "#E8913A",
  },
  {
    quote: "Le courrier de l'école était en allemand, impossible à comprendre. En 30 secondes, SchoolBridge m'a tout traduit.",
    name: "Olena K.",
    role: "Mère d'1 enfant · Heilbronn",
    flag: "🇺🇦",
    color: "#2A6F97",
  },
  {
    quote: "J'ai trouvé un mediateur qui parle arabe grâce à la communauté. Je ne savais même pas que ce service existait.",
    name: "Ahmad M.",
    role: "Père de 3 enfants · Heilbronn",
    flag: "🇸🇾",
    color: "#2D8A56",
  },
];

const languages = [
  { flag: "🇹🇷", name: "Turc" },
  { flag: "🇸🇦", name: "Arabe" },
  { flag: "🇺🇦", name: "Ukrainien" },
  { flag: "🇷🇺", name: "Russe" },
  { flag: "🇵🇱", name: "Polonais" },
  { flag: "🇷🇴", name: "Roumain" },
  { flag: "🇬🇧", name: "Anglais" },
  { flag: "🇫🇷", name: "Français" },
  { flag: "🇮🇷", name: "Farsi" },
  { flag: "🇦🇫", name: "Dari" },
  { flag: "🇪🇸", name: "Espagnol" },
  { flag: "🇮🇹", name: "Italien" },
  { flag: "🇵🇹", name: "Portugais" },
  { flag: "🇯🇵", name: "Japonais" },
  { flag: "🇪🇷", name: "Tigrinya" },
  { flag: "🌐", name: "Autre" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Top navigation ─────────────────────────────────────────────────── */}
      <header className="h-16 flex items-center px-6 md:px-10 border-b border-line bg-white/90 backdrop-blur-sm sticky top-0 z-40"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <span className="font-display font-bold text-primary text-xl flex items-center gap-2">
          🎓 SchoolBridge
        </span>
        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/chat?parentId=PAR-001"
            className="text-sm text-muted hover:text-foreground transition-colors duration-200 hidden sm:block"
          >
            Voir la démo
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            S'inscrire
          </Link>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-24 md:py-32"
        style={{
          background: "linear-gradient(160deg, #0D2E45 0%, #1B4B6B 45%, #1E5F82 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div aria-hidden className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(circle, #E8913A, transparent)" }} />
          <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #2A6F97, transparent)" }} />
          <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />
        </div>

        {/* Grid pattern overlay */}
        <div aria-hidden className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Hackathon IPAI 2026 · Heilbronn
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-5xl md:text-7xl leading-none mb-6 text-white">
            School<span style={{ color: "#E8913A" }}>Bridge</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-white/70 font-medium mb-4 leading-relaxed">
            La passerelle entre votre famille<br className="hidden md:block" /> et le système scolaire allemand.
          </p>

          <p className="text-base text-white/50 max-w-md mx-auto mb-12">
            Multilingue · Intelligent · Toujours disponible
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/chat?parentId=PAR-001"
              className="inline-flex items-center gap-3 font-display font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-100"
              style={{
                background: "linear-gradient(135deg, #E8913A 0%, #C97820 100%)",
                color: "white",
                boxShadow: "0 8px 32px rgba(232,145,58,0.4)",
              }}
            >
              <span>▶</span>
              Essayer la démo
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200 hover:border-white/50"
            >
              Créer mon profil
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              16 langues supportées
            </span>
            <span className="w-px h-4 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Propulsé par Gemini 2.5 Flash
            </span>
            <span className="w-px h-4 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Gratuit · Open source
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-line py-6 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: "16", label: "Langues supportées", color: "#1B4B6B" },
            { val: "4", label: "Fonctionnalités clés", color: "#E8913A" },
            { val: "< 3s", label: "Temps de réponse", color: "#2D8A56" },
            { val: "24/7", label: "Disponible", color: "#9B59B6" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="font-display font-bold text-3xl" style={{ color: s.color }}>{s.val}</span>
              <span className="text-xs text-muted font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-canvas-soft">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted text-lg max-w-lg mx-auto">
              Un outil complet pour naviguer le système scolaire allemand en toute confiance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-line p-6 flex flex-col gap-4 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200 cursor-default group"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-foreground text-base">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Prêt en 30 secondes
            </h2>
            <p className="text-muted text-lg">
              Pas d'installation. Pas d'attente. Ouvrez le chat et commencez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-line" />

            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 border-white z-10 relative"
                    style={{
                      background: "linear-gradient(135deg, #1B4B6B, #2A6F97)",
                      boxShadow: "0 4px 16px rgba(27,75,107,0.25)",
                    }}
                  >
                    {s.icon}
                  </div>
                  <span
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center z-20"
                    style={{ background: "#E8913A" }}
                  >
                    {s.num}
                  </span>
                </div>
                <h3 className="font-display font-bold text-foreground text-lg">{s.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-14">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-xl border-2 text-primary hover:bg-primary-lighter transition-all duration-200"
              style={{ borderColor: "var(--color-primary)" }}
            >
              Créer mon profil
            </Link>
            <Link
              href="/chat?parentId=PAR-001"
              className="flex items-center justify-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-xl text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              Tester la démo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-canvas-soft">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Ce que disent les parents
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-line p-6 flex flex-col gap-4"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                {/* Quote mark */}
                <span className="text-4xl leading-none font-serif" style={{ color: t.color, opacity: 0.4 }}>"</span>
                <p className="text-foreground text-sm leading-relaxed flex-1 -mt-4">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-line">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ background: `${t.color}18` }}
                  >
                    {t.flag}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Languages ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-t border-line">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted uppercase tracking-widest mb-8">
            Langues supportées
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {languages.map((l) => (
              <div
                key={l.name}
                className="flex items-center gap-2 bg-canvas-soft border border-line rounded-full px-3 py-1.5 text-sm text-muted hover:border-primary/30 hover:text-foreground transition-colors cursor-default"
              >
                <span className="text-base">{l.flag}</span>
                <span className="font-medium">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0D2E45 0%, #1B4B6B 60%, #E8913A 200%)",
        }}
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-40px] right-[-40px] w-[300px] h-[300px] rounded-full opacity-[0.1]"
            style={{ background: "radial-gradient(circle, #E8913A, transparent)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
            Commencez maintenant — c'est gratuit
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Rejoignez les familles qui naviguent le système scolaire allemand avec confiance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 font-display font-semibold text-base px-8 py-4 rounded-xl text-primary bg-white hover:bg-white/90 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              Créer mon profil gratuitement
            </Link>
            <Link
              href="/chat?parentId=PAR-001"
              className="inline-flex items-center justify-center gap-2 font-semibold text-base px-8 py-4 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200"
            >
              Voir la démo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
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
            <Link href="/register" className="hover:text-foreground transition-colors">
              S'inscrire
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
