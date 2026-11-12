"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import { matchingService, MatchDetail } from "@/services/matching";
import {
  Bell,
  Search,
  UserCircle,
  Menu,
  BrainCircuit,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SYSTEM_SUPPORT_INFO } from "@/lib/constants";
import { getNavbarSearchPlaceholder } from "@/lib/navbar";

export function Navbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFarmer, isBuyer } = useUser();

  // Avatar state from local storage
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = encodeURIComponent(searchQuery.trim());
    if (isFarmer) {
      router.push(`/dashboard/farmer/listings?search=${q}`);
    } else {
      router.push(`/dashboard/buyer/dashboard?search=${q}`);
    }
  };

  // Sync avatar from localStorage and listen to updates
  useEffect(() => {
    const loadAvatar = () => {
      if (typeof window !== "undefined" && user?.sub) {
        const stored = localStorage.getItem(`user_avatar_${user.sub}`);
        setPhotoUrl(stored || "");
      }
    };

    loadAvatar();
    window.addEventListener("avatar-updated", loadAvatar);
    return () => window.removeEventListener("avatar-updated", loadAvatar);
  }, [user?.sub]);

  // Click outside listener to close notification popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch relevant matches for live notifications
  const { data: suggestions } = useQuery({
    queryKey: ["navbar-suggestions"],
    queryFn: matchingService.getBuyerSuggestions,
    enabled: isBuyer,
    refetchInterval: 10000,
  });

  const { data: myMatches } = useQuery({
    queryKey: ["navbar-my-matches"],
    queryFn: matchingService.getMyBuyerMatches,
    enabled: isBuyer,
    refetchInterval: 10000,
  });

  // Calculate notification list
  const notifications: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: "match" | "accepted" | "alert";
    href: string;
  }> = [];

  if (isBuyer) {
    if (suggestions && suggestions.length > 0) {
      notifications.push({
        id: "ai-sugg",
        title: "New AI Harvest Matches Found",
        description: `${suggestions.length} fresh produce listing(s) match your buying capacity.`,
        time: "Just now",
        type: "match",
        href: "/dashboard/buyer/dashboard",
      });
    }

    const acceptedMatches = myMatches?.filter((m) => m.status === "accepted") || [];
    if (acceptedMatches.length > 0) {
      notifications.push({
        id: "deal-accepted",
        title: "Deal Accepted by Farmer!",
        description: `A farmer accepted your interest. You can now finalize the transaction.`,
        time: "Active",
        type: "accepted",
        href: "/dashboard/buyer/dashboard",
      });
    }
  }

  if (isFarmer) {
    notifications.push({
      id: "farmer-pulse",
      title: "Market Demand Pulse",
      description: "Buyers in your district are actively looking for fresh harvest supplies.",
      time: "Today",
      type: "alert",
      href: "/dashboard/farmer/listings",
    });
  }

  const unreadCount = notifications.length;

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-8 relative">
      {/* 1. Left: Search Bar (Hidden on Mobile) */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-green-600 transition-colors" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getNavbarSearchPlaceholder(user?.role)}
            className="w-full bg-slate-100/50 border border-slate-200 py-2 pl-10 pr-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </form>

      {/* Mobile Menu Icon (Visible on small screens) */}
      <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu size={24} />
      </button>

      {/* 2. Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* AI Insight Shortcut */}
        <Link 
          href={isFarmer ? "/dashboard/farmer/analytics" : "/dashboard/buyer/dashboard"} 
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          <BrainCircuit size={16} />
          <span className="text-[10px] font-black uppercase tracking-tighter">AI Assistant</span>
        </Link>

        {/* Help & Support Guide Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all focus:outline-none"
          title="SMS & Platform Guide"
        >
          <HelpCircle size={20} />
        </button>

        {/* Help & Support Guide Button */}

        <button

          onClick={() => setShowHelp(true)}

          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all focus:outline-none"

          title="SMS & Platform Guide"

        >

          <HelpCircle size={20} />

        </button>



        {/* Notifications Bell with Interactive Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all focus:outline-none"
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION POPOVER */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-green-700" />
                  <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} New
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 space-y-1">
                    <CheckCircle2 size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-medium">All caught up! No unread alerts.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => setShowNotifications(false)}
                      className="block p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-green-50 text-green-700 mt-0.5 group-hover:scale-105 transition-transform">
                          {notif.type === "accepted" ? (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          ) : notif.type === "match" ? (
                            <Sparkles size={16} className="text-amber-500" />
                          ) : (
                            <BrainCircuit size={16} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 leading-snug group-hover:text-green-700 transition-colors">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            {notif.description}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-green-700 hover:underline inline-flex items-center gap-1"
                >
                  Notification Settings <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Identity & Avatar */}
        <Link 
          href="/dashboard/settings"
          className="flex items-center gap-3 pl-3 border-l border-slate-200 ml-1 hover:opacity-90 transition group"
          title="Account Settings"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 leading-none group-hover:text-green-700 transition-colors">
              {profile?.full_name ? profile.full_name.split(" ")[0] : (user?.phone || "User")}
            </p>
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
              {user?.role}
            </p>
          </div>

          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:border-green-400 transition-colors shadow-sm">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-green-700 to-emerald-500 text-white flex items-center justify-center text-xs font-black">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* --- Help & Prototype Guide Modal --- */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900">AgriMarket Guide & Support</h3>
                <p className="text-xs text-slate-500">How to use the prototype effectively</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MessageSquare size={16} className="text-green-600" />
                  <span>SMS & Bargaining Flow</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  When a buyer clicks <strong>Bargain / Express Interest</strong> on a harvest, both the farmer and buyer receive immediate SMS alerts. They can negotiate counter-offers (price, quantity, delivery location) in real time.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <BrainCircuit size={16} className="text-blue-600" />
                  <span>AI Pricing & Match Engine</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The AI continuously compares harvest listings against historical commodity prices and buyer procurement demand to generate confidence scores and suggest optimal pricing.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1 text-slate-700">
                <p className="font-bold text-emerald-900">Need Immediate Assistance?</p>
                <p>Hotline: <strong className="text-slate-900">{SYSTEM_SUPPORT_INFO.hotline}</strong></p>
                <p>USSD / SMS: <strong className="text-slate-900">{SYSTEM_SUPPORT_INFO.smsChannel}</strong></p>
                <p>Support Hours: <span className="text-slate-600">{SYSTEM_SUPPORT_INFO.hours}</span></p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full btn-primary py-3 rounded-2xl font-bold"
            >
              Got it, let's trade!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
