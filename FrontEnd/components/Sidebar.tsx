"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Sprout, 
  BarChart3, 
  ShoppingBag, 
  ClipboardList, 
  Settings, 
  LogOut,
  ShieldCheck, 
  ChevronRight,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const role = user?.role as "farmer" | "buyer" | "admin" | undefined;

  const getMenuItems = () => {
    if (role === "farmer") {
      return [
        { label: t.nav.dashboard, href: "/dashboard/farmer/dashboard", icon: LayoutDashboard },
        { label: t.nav.myListings, href: "/dashboard/farmer/listings", icon: Sprout },
        { label: t.nav.performance, href: "/dashboard/farmer/analytics", icon: BarChart3 },
      ];
    }
    if (role === "buyer") {
      return [
        { label: t.nav.marketplace, href: "/dashboard/buyer/dashboard", icon: ShoppingBag },
        { label: t.nav.procurement, href: "/dashboard/buyer/requests", icon: ClipboardList },
      ];
    }
    if (role === "admin") {
      return [
        { label: t.nav.systemHealth, href: "/dashboard/admin/dashboard", icon: ShieldCheck },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex flex-col h-full bg-green-950 text-white border-r border-green-900 shadow-2xl">
      {/* 1. Branding Section */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl text-green-950">
            <Sprout size={24} />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter">AGROMARKET</span>
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest block -mt-1">
              Rwanda
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Navigation Section */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest px-3 mb-4">
          {role === "farmer" ? t.common.farmer : role === "buyer" ? t.common.buyer : t.common.admin} Menu
        </p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-green-700 text-white shadow-lg" 
                  : "text-green-300 hover:bg-green-900 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(isActive ? "text-yellow-400" : "text-green-500 group-hover:text-green-400")} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-yellow-400" />}
            </Link>
          );
        })}
      </nav>

      {/* 3. Bottom Actions Section with Language Switcher */}
      <div className="p-4 border-t border-green-900 space-y-2">
        {/* Quick Language Toggle */}
        <button
          onClick={() => setLanguage(language === "rw" ? "en" : "rw")}
          className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-green-300 hover:text-white bg-green-900/40 hover:bg-green-900/80 rounded-xl transition-colors"
          title={t.common.switchLanguage}
        >
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-green-400" />
            <span>{language === "rw" ? "🇷🇼 Ikinyarwanda" : "🇬🇧 English"}</span>
          </div>
          <span className="text-[10px] bg-green-800 text-green-200 px-2 py-0.5 rounded-full font-semibold">
            {language === "rw" ? "Kuri EN" : "Ku RW"}
          </span>
        </button>

        <Link 
          href="/dashboard/settings" 
          className="flex items-center gap-3 px-3 py-3 text-sm font-bold text-green-400 hover:text-white rounded-xl transition-colors"
        >
          <Settings size={20} />
          <span>{t.common.settings}</span>
        </Link>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all active:scale-95"
        >
          <LogOut size={20} />
          <span>{t.common.logout}</span>
        </button>
      </div>
    </div>
  );
}
