"use client";

import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import NavBar from "@/components/NavBar";

export default function ChatPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  return (
    <main className="h-screen flex flex-col bg-white overflow-hidden">
      {/* NavBar — hide mobile bottom bar (chat has its own context bar) */}
      <NavBar parentId={parentId} activePage="chat" hideMobileBar={true} />

      {/* Chat interface fills remaining space */}
      <ChatInterface parentId={parentId} />
    </main>
  );
}
