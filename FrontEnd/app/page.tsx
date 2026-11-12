"use client";

import Link from "next/link";
import {
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Sprout,
  LogIn,
  UserPlus
} from "lucide-react";
import { LiveHarvestsSection } from "@/components/LiveHarvestsSection";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* --- Top Public Navigation Bar with Language Switcher --- */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-emerald-900/40 text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Sprout size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                AgroMarket <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-300/80 uppercase tracking-widest block -mt-1">
                Rwanda
              </span>
            </div>
          </Link>

          {/* Quick Actions & Language Selector */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            {/* Auth shortcuts */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-emerald-900/50">
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-100 hover:text-white transition flex items-center gap-1.5"
              >
                <LogIn size={14} />
                <span>{t.nav.signIn}</span>
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>{t.nav.createAccount}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
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

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-emerald-800 text-xs font-bold uppercase tracking-wider animate-fade-in shadow-md">
            <TrendingUp size={14} className="text-emerald-700" />
            <span>{t.home.aiActiveBanner}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
            {t.home.heroTitlePrefix}
            <span className="text-emerald-300">{t.home.heroTitleHighlight}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-emerald-50/90 leading-relaxed max-w-3xl mx-auto font-medium">
            {t.home.heroDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/auth/register"
              className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-base font-extrabold rounded-2xl shadow-xl shadow-green-950/40 w-full sm:w-auto"
            >
              <span>{t.home.startSellingCta}</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 text-base font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all w-full sm:w-auto"
            >
              {t.home.buyerCta}
            </Link>
          </div>
        </div>
      </section>

      {/* --- Value Proposition Grid --- */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 bg-white hover:border-green-300 rounded-3xl transition-all shadow-sm group">
              <div className="w-14 h-14 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-700 group-hover:text-white transition-colors">
                <BarChart3 size={26} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">{t.home.feature1Title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {t.home.feature1Desc}
              </p>
            </div>

            <div className="card p-8 bg-white hover:border-amber-300 rounded-3xl transition-all shadow-sm group">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Users size={26} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">{t.home.feature2Title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {t.home.feature2Desc}
              </p>
            </div>

            <div className="card p-8 bg-white hover:border-blue-300 rounded-3xl transition-all shadow-sm group">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">{t.home.feature3Title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {t.home.feature3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Targeted Role Section --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
              {t.home.farmerSectionTitlePrefix}
              <span className="text-green-700">{t.home.farmerSectionTitleHighlight}</span>
            </h2>
            <ul className="space-y-4">
              {[
                t.home.benefit1,
                t.home.benefit2,
                t.home.benefit3,
                t.home.benefit4
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 text-green-700 rounded-full p-1 shrink-0">
                    <ArrowRight size={14} />
                  </div>
                  <span className="text-slate-700 font-medium text-sm md:text-base">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold">
                {t.home.createFarmerProfileCta} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-green-200/50 rounded-3xl blur-2xl"></div>
            <div className="relative card aspect-video bg-[url('https://rwandainspirer.com/wp-content/uploads/2018/05/potatoes-800x445.jpg')] bg-cover bg-center rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl w-fit shadow-lg border border-white/40">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">
                    {t.home.marketGapBadge}
                  </p>
                  <p className="text-base font-extrabold text-slate-900">{t.home.marketGapCrop}</p>
                  <p className="text-xs text-green-700 font-bold">{t.home.marketGapStat}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Live Farmer Harvests Feed --- */}
      <LiveHarvestsSection />

      {/* --- Footer Statistics --- */}
      <section className="py-14 bg-green-950 text-green-50 mt-auto border-t border-green-900">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-yellow-400">{t.home.statFarmers}</p>
            <p className="text-xs uppercase tracking-wider text-green-300 font-bold">{t.home.statFarmersLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-yellow-400">{t.home.statBuyers}</p>
            <p className="text-xs uppercase tracking-wider text-green-300 font-bold">{t.home.statBuyersLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-yellow-400">{t.home.statDistricts}</p>
            <p className="text-xs uppercase tracking-wider text-green-300 font-bold">{t.home.statDistrictsLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-black text-yellow-400">{t.home.statRecovery}</p>
            <p className="text-xs uppercase tracking-wider text-green-300 font-bold">{t.home.statRecoveryLabel}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
