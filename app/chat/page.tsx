import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
