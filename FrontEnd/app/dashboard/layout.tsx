"use client";

import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, _hasHydrated } = useAuth();

  // Guard: If checking auth, show a loading screen
  // This prevents the "flash" of dashboard before redirecting to login
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-green-700" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. Sidebar - Fixed on Desktop, Hidden on Mobile */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-green-900">
        <Sidebar />
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Sticky Top Navigation */}
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b">
          <Navbar />
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </main>

        <footer className="p-6 text-center text-xs text-slate-400 border-t bg-white">
          © {new Date().getFullYear()} AgroMarket AI. Real-time Agricultural Intelligence.
        </footer>
      </div>
    </div>
  );
}