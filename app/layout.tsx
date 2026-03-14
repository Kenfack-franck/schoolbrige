import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolBridge",
  description: "Mentor IA multilingue pour les parents dans le système scolaire allemand",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
