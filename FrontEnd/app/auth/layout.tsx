import Link from "next/link";
import { Sprout, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col justify-between">
      {/* Retained Video Background & Overlays */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.pexels.com/photos/28468190/pexels-photo-28468190.jpeg?cs=srgb&dl=pexels-renni-28468190.jpg&fm=jpg"
      >
        <source
          src="https://videos.pexels.com/video-files/33822003/14354848_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-emerald-900/75 to-slate-950/80"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_28%)]"></div>

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            <Sprout size={20} />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white drop-shadow-sm">
            AgroMarket <span className="text-emerald-400">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="header" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100/90 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md transition-all"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Centered Compact Card (No Scroll) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/25 bg-white/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          {children}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 w-full px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-emerald-100/70 border-t border-white/10 bg-black/15 backdrop-blur-sm">
        <p>© {new Date().getFullYear()} AgroMarket AI. Fair Pricing & Direct Market Access.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-white transition-colors">Help & Support</Link>
        </div>
      </footer>
    </div>
  );
}
