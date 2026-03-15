import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ElternGuide — Votre guide scolaire intelligent",
  description:
    "Le guide entre votre famille et l'école allemande. Multilingue, personnalisé, disponible 24h/24.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${dmSans.variable}`}>
      <body className="bg-white text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
