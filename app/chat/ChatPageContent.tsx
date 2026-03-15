"use client";

import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import NavBar from "@/components/NavBar";

export default function ChatPageContent() {
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parentId");

  return (
    /*
      On mobile: the fixed bottom nav bar is ~56px tall (h-14).
      We add pb-14 on mobile so the chat input sits above the nav bar.
      On desktop (md+): no bottom bar → no extra padding needed.
    */
    <main className="h-screen flex flex-col bg-white overflow-hidden pb-14 md:pb-0">
      <NavBar parentId={parentId} activePage="chat" />
      <ChatInterface parentId={parentId} />
    </main>
  );
}
