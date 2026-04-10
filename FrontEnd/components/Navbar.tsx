"use client";

import { useAuth } from "@/hooks/useAuth";
import { 
  Bell, 
  Search, 
  UserCircle, 
  Menu, 
  BrainCircuit, 
  HelpCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user } = useAuth();

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-8">
      {/* 1. Left: Search Bar (Hidden on Mobile) */}
      <div className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-green-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={user?.role === "buyer" ? "Search crops or districts..." : "Search transactions..."}
            className="w-full bg-slate-100/50 border border-slate-200 py-2 pl-10 pr-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Mobile Menu Icon (Visible on small screens) */}
      <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu size={24} />
      </button>

      {/* 2. Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* AI Insight Shortcut */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
          <BrainCircuit size={16} />
          <span className="text-[10px] font-black uppercase tracking-tighter">AI Assistant</span>
        </button>

        {/* Notifications Bell */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all">
          <Bell size={20} />
          {/* Active Notification Indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all">
          <HelpCircle size={20} />
        </button>

        {/* User Identity */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
          <div className="text-right hidden xs:block">
            <p className="text-xs font-black text-slate-900 leading-none">
              {user?.phone || "Anonymous"}
            </p>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
              {user?.role}
            </p>
          </div>
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
            <UserCircle size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}