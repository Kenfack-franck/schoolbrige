import { Suspense } from "react";
import CommunityPageContent from "./CommunityPageContent";

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <CommunityPageContent />
    </Suspense>
  );
}
