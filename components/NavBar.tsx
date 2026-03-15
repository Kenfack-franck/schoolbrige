"use client";

import Link from "next/link";

export interface NavBarProps {
  parentId: string | null;
  activePage: "chat" | "dashboard" | "community";
  hideMobileBar?: boolean;
}

interface NavItem {
  key: "chat" | "dashboard" | "community";
  label: string;
  icon: string;
  href: string;
}

export default function NavBar({ parentId, activePage, hideMobileBar = false }: NavBarProps) {
  // Desktop nav — Dashboard only for identified users
  const desktopNavItems: NavItem[] = [
    {
      key: "chat",
      label: "Chat",
      icon: "💬",
      href: parentId ? `/chat?parentId=${parentId}` : "/chat",
    },
    ...(parentId
      ? [
          {
            key: "dashboard" as const,
            label: "Dashboard",
            icon: "📊",
            href: `/dashboard?parentId=${parentId}`,
          },
        ]
      : []),
    {
      key: "community",
      label: "Community",
      icon: "👥",
      href: parentId ? `/community?parentId=${parentId}` : "/community",
    },
  ];

  // Mobile bottom bar — always 3 items; anonymous users get grayed-out Dashboard + Community
  const mobileNavItems: Array<NavItem & { enabled: boolean }> = [
    {
      key: "chat",
      label: "Chat",
      icon: "💬",
      href: parentId ? `/chat?parentId=${parentId}` : "/chat",
      enabled: true,
    },
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "📊",
      href: parentId ? `/dashboard?parentId=${parentId}` : "#",
      enabled: !!parentId,
    },
    {
      key: "community",
      label: "Community",
      icon: "👥",
      href: parentId ? `/community?parentId=${parentId}` : "#",
      enabled: !!parentId,
    },
  ];

  return (
    <>
      {/* ── Header (visible all sizes) ────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-line flex items-center px-4 md:px-8 gap-4 shrink-0 z-40">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-bold text-primary text-xl hover:text-primary-light transition-colors duration-200 whitespace-nowrap"
        >
          🎓 <span className="hidden sm:inline">ElternGuide</span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {desktopNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                activePage === item.key
                  ? "bg-primary-lighter text-primary"
                  : "text-muted hover:bg-canvas-muted hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {parentId ? (
            <Link
              href="/select"
              className="hidden md:block text-sm text-muted hover:text-primary transition-colors duration-200"
            >
              Switch profile
            </Link>
          ) : (
            <Link
              href="/select"
              className="text-base text-primary border border-primary px-4 py-2 rounded-xl hover:bg-primary-lighter transition-all duration-200 font-medium"
            >
              Log in
            </Link>
          )}
        </div>
      </header>

      {/* ── Mobile bottom bar ────────────────────────────────────────────── */}
      {!hideMobileBar && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-line"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex h-14">
            {mobileNavItems.map((item) => {
              const isActive = activePage === item.key;

              if (!item.enabled) {
                // Grayed-out non-clickable item for anonymous users
                return (
                  <div
                    key={item.key}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 opacity-30 cursor-not-allowed select-none"
                  >
                    <span className="text-xl leading-none text-muted">{item.icon}</span>
                    <span className="text-[10px] font-medium text-muted leading-tight">
                      {item.label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200"
                >
                  {/* Icon with active highlight */}
                  <div
                    className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                      isActive ? "bg-primary-lighter" : ""
                    }`}
                  >
                    <span
                      className={`text-xl leading-none ${
                        isActive ? "text-primary" : "text-muted"
                      }`}
                    >
                      {item.icon}
                    </span>
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium leading-tight ${
                      isActive ? "text-primary" : "text-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
