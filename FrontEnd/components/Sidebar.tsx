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
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Define Navigation links for each role
const MENU_MAP = {
  farmer: [
    { label: "Dashboard", href: "/dashboard/farmer/dashboard", icon: LayoutDashboard },
    { label: "My Listings", href: "/dashboard/farmer/listings", icon: Sprout },
    { label: "Performance", href: "/dashboard/farmer/analytics", icon: BarChart3 },
  ],
  buyer: [
    { label: "Marketplace", href: "/dashboard/buyer/dashboard", icon: ShoppingBag },
    { label: "Procurement", href: "/dashboard/buyer/requests", icon: ClipboardList },
  ],
  admin: [
    { label: "System Health", href: "/dashboard/admin/dashboard", icon: ShieldCheck },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Default to empty if role not found, though layout guard prevents this
  const role = user?.role as keyof typeof MENU_MAP;
  const menuItems = MENU_MAP[role] || [];

  return (
    <div className="flex flex-col h-full bg-green-950 text-white border-r border-green-900 shadow-2xl">
      {/* 1. Branding Section */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl text-green-950">
            <Sprout size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter">AGROMARKET</span>
        </Link>
      </div>

      {/* 2. Navigation Section */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest px-3 mb-4">
          {role} Menu
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

      {/* 3. Bottom Actions Section */}
      <div className="p-4 border-t border-green-900 space-y-2">
        <Link 
          href="/settings" 
          className="flex items-center gap-3 px-3 py-3 text-sm font-bold text-green-400 hover:text-white rounded-xl transition-colors"
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all active:scale-95"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}