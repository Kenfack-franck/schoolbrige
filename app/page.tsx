import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "🌍",
    title: "Natively multilingual",
    description: "Speak in your language. The assistant understands and responds effortlessly — Turkish, Arabic, Ukrainian and 13 other languages.",
    accent: "#EBF4FB",
    iconBg: "#1B4B6B",
  },
  {
    icon: "📄",
    title: "Read your letters",
    description: "Photograph a letter from school. The assistant translates it, explains it and identifies the actions to take.",
    accent: "#FEF3E8",
    iconBg: "#E8913A",
  },
  {
    icon: "👥",
    title: "Active community",
    description: "Connect with other parents and school professionals. Mutual support and shared information.",
    accent: "#EDFAF3",
    iconBg: "#2D8A56",
  },
  {
    icon: "📅",
    title: "Smart agenda",
    description: "Never miss a date again. Your school agenda is updated automatically during the chat.",
    accent: "#F3EDFB",
    iconBg: "#9B59B6",
  },
];

const steps = [
  {
    num: "1",
    title: "Create your profile",
    desc: "30 seconds. Your language, your children, your school.",
    icon: "✍️",
  },
  {
    num: "2",
    title: "Ask your questions",
    desc: "In your language. The assistant understands and responds with official sources.",
    icon: "💬",
  },
  {
    num: "3",
    title: "Act with confidence",
    desc: "Agenda, contacts, documents — everything is organised for you.",
    icon: "✅",
  },
];

const testimonials = [
  {
    quote: "I finally understood my son's report card. The assistant explained it to me in Turkish, with all the details.",
    name: "Fatma Y.",
    role: "Mother of 2 children · Heilbronn",
    flag: "🇹🇷",
    color: "#E8913A",
  },
  {
    quote: "The letter from school was in German, impossible to understand. In 30 seconds, ElternGuide translated everything for me.",
    name: "Olena K.",
    role: "Mother of 1 child · Heilbronn",
    flag: "🇺🇦",
    color: "#2A6F97",
  },
  {
    quote: "I found a mediator who speaks Arabic thanks to the community. I didn't even know this service existed.",
    name: "Ahmad M.",
    role: "Father of 3 children · Heilbronn",
    flag: "🇸🇾",
    color: "#2D8A56",
  },
];

const languages = [
  { flag: "🇹🇷", name: "Turkish" },
  { flag: "🇸🇦", name: "Arabic" },
  { flag: "🇺🇦", name: "Ukrainian" },
  { flag: "🇷🇺", name: "Russian" },
  { flag: "🇵🇱", name: "Polish" },
  { flag: "🇷🇴", name: "Romanian" },
  { flag: "🇬🇧", name: "English" },
  { flag: "🇫🇷", name: "French" },
  { flag: "🇮🇷", name: "Farsi" },
  { flag: "🇦🇫", name: "Dari" },
  { flag: "🇪🇸", name: "Spanish" },
  { flag: "🇮🇹", name: "Italian" },
  { flag: "🇵🇹", name: "Portuguese" },
  { flag: "🇯🇵", name: "Japanese" },
  { flag: "🇪🇷", name: "Tigrinya" },
  { flag: "🌐", name: "Other" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Top navigation ─────────────────────────────────────────────────── */}
      <header className="h-16 flex items-center px-6 md:px-10 border-b border-line bg-white/90 backdrop-blur-sm sticky top-0 z-40"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <span className="font-display font-bold text-primary text-xl flex items-center gap-2">
          🎓 ElternGuide
        </span>
        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/chat?parentId=PAR-001"
            className="text-sm text-muted hover:text-foreground transition-colors duration-200 hidden sm:block"
          >
            View demo
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-5 py-2 rounded-xl text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            Sign up
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
            The bridge between your family<br className="hidden md:block" /> and the German school system.
          </p>

          <p className="text-base text-white/50 max-w-md mx-auto mb-12">
            Multilingual · Intelligent · Always available
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
              Try the demo
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-semibold text-base px-8 py-4 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200 hover:border-white/50"
            >
              Create my profile
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              16 supported languages
            </span>
            <span className="w-px h-4 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Powered by Gemini 2.5 Flash
            </span>
            <span className="w-px h-4 bg-white/20 hidden sm:block" />
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Free · Open source
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-line py-6 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: "16", label: "Supported languages", color: "#1B4B6B" },
            { val: "4", label: "Key features", color: "#E8913A" },
            { val: "< 3s", label: "Response time", color: "#2D8A56" },
            { val: "24/7", label: "Available", color: "#9B59B6" },
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
              Everything you need
            </h2>
            <p className="text-muted text-lg max-w-lg mx-auto">
              A complete tool to navigate the German school system with confidence.
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
              Ready in 30 seconds
            </h2>
            <p className="text-muted text-lg">
              No installation. No waiting. Open the chat and get started.
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
              Create my profile
            </Link>
            <Link
              href="/chat?parentId=PAR-001"
              className="flex items-center justify-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-xl text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              Try the demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-canvas-soft">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              What parents say
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
            Supported languages
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
            Start now — it&apos;s free
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join the families navigating the German school system with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 font-display font-semibold text-base px-8 py-4 rounded-xl text-primary bg-white hover:bg-white/90 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              Create my profile for free
            </Link>
            <Link
              href="/chat?parentId=PAR-001"
              className="inline-flex items-center justify-center gap-2 font-semibold text-base px-8 py-4 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200"
            >
              View demo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 bg-canvas-soft border-t border-line">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <span className="font-display font-semibold text-foreground">
            🎓 ElternGuide
          </span>
          <span>
            Made with{" "}
            <span style={{ color: "var(--color-danger)" }}>❤️</span> at{" "}
            <strong className="text-foreground">IPAI Hackathon 2026</strong> — Heilbronn, Germany
          </span>
          <div className="flex items-center gap-4">
            <Link href="/register" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
            <Link href="/community" className="hover:text-foreground transition-colors">
              Community
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
