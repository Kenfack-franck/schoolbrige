import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Chargement du dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
