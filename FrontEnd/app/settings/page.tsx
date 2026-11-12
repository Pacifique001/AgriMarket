"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/settings");
  }, [router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="animate-spin text-green-700 mx-auto" size={36} />
        <p className="text-sm font-medium text-slate-500">Loading your settings in AgroMarket Dashboard...</p>
      </div>
    </div>
  );
}
