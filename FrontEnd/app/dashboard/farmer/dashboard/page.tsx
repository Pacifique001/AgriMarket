"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Sprout,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  Activity
} from "lucide-react";
import Link from "next/link";

// Modular Services & Hooks
import { analyticsService } from "@/services/analytics";
import { FarmerProfile, useUser } from "@/hooks/useUser";
import { useMarketAI } from "@/hooks/useMarketAI";
import { MarketTrendChart } from "@/components/Charts";
import { cn } from "@/lib/utils";

export default function FarmerDashboard() {
  const { profile, isFarmer, isLoading: userLoading } = useUser();
  const { useCropTrends } = useMarketAI();

  // 1. Query: Fetch Farmer Statistics (GMV, Volume, Listings)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["farmer-stats"],
    queryFn: analyticsService.getFarmerStats,
    enabled: isFarmer, // Only fetch if user is confirmed as farmer
  });

  // 2. Query: Fetch Nearby Buyers Summary (Demand Pulse)
  const { data: buyersCount } = useQuery({
    queryKey: ["nearby-buyers"],
    queryFn: analyticsService.getNearbyBuyers,
    enabled: isFarmer,
  });

  // 3. Hook: Fetch real AI Price Trends for the chart (Defaulting to Maize)
  const { data: trendData, isLoading: trendsLoading } = useCropTrends("Maize");
  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;
  // Role Guard: Block unauthorized access
  if (!userLoading && !isFarmer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Farmer Access Only</h2>
        <p className="text-slate-500">Please log in with a farmer account to view this dashboard.</p>
      </div>
    );
  }

  if (userLoading || statsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-700 mx-auto" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Loading your farm insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Hello, {profile?.full_name?.split(" ")[0] || "Farmer"}!
          </h1>
          <p className="text-slate-500 font-medium">Your farm business overview in {farmerProfile?.district}.</p>
        </div>
        <Link href="/dashboard/farmer/listings" className="btn-primary flex items-center gap-2 shadow-lg px-6 py-3">
          <Plus size={18} /> List New Harvest
        </Link>
      </div>

      {/* --- KPI Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={stats?.active_listings || 0}
          icon={<Package className="text-blue-600" />}
          description="Live in marketplace"
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={`${(stats?.total_revenue_rwf || 0).toLocaleString()} RWF`}
          icon={<DollarSign className="text-green-600" />}
          description="Confirmed earnings"
          color="green"
        />
        <StatCard
          title="Volume Sold"
          value={`${(stats?.total_volume_sold_kg || 0).toLocaleString()} KG`}
          icon={<Sprout className="text-amber-600" />}
          description="Produce moved"
          color="amber"
        />
        <StatCard
          title="Market Reach"
          value={stats?.market_reach || 0}
          icon={<Users className="text-purple-600" />}
          description="Unique buyers matched"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- AI Price Trends Section --- */}
        <div className="lg:col-span-2 card p-6 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                AI Market Trends: Maize
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Based on nationwide transaction data</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <Activity size={14} className="text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live AI Analysis</span>
            </div>
          </div>

          <div className="h-72 w-full">
            {trendsLoading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
            ) : (
              <MarketTrendChart data={trendData || []} />
            )}
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              <span className="font-bold text-green-700 not-italic mr-1">Pro Tip:</span>
              Maize prices in {farmerProfile?.district} are trending upward. Consider listing your remaining stock before the next harvest cycle.
            </p>
          </div>
        </div>

        {/* --- Sidebar: Insights & Handshakes --- */}
        <div className="space-y-4">
          {/* Nearby Buyers Widget */}
          <div className="card p-6 bg-green-900 text-white shadow-xl border-none">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-yellow-400" size={24} />
              <h3 className="font-bold text-lg">Market Demand</h3>
            </div>
            <p className="text-green-100 text-sm leading-relaxed mb-6">
              There are currently <strong>{buyersCount?.potential_buyers || 0}</strong> verified buyers in <strong>{farmerProfile?.district}</strong> looking for fresh harvests.
            </p>
            <Link
              href="/dashboard/farmer/listings"
              className="group w-full bg-yellow-400 text-green-950 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-300 transition-all active:scale-95"
            >
              Contact Local Buyers <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Action Required Widget */}
          <div className="card p-6 border-amber-200 bg-amber-50 group hover:border-amber-400 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Action Required</h4>
                <p className="text-amber-800 text-xs mt-1 font-medium leading-relaxed">
                  Buyers are waiting! You have pending matches. Accept them to share contact info.
                </p>
                <Link href="/dashboard/farmer/listings" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-amber-900 uppercase tracking-tighter hover:underline">
                  Manage Matches <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Specialized StatCard Component ---
function StatCard({ title, value, icon, description, color }: any) {
  const colorMap: any = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="card p-6 flex flex-col gap-4 bg-white hover:border-slate-300 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
        <div className={cn("p-2 rounded-lg group-hover:scale-110 transition-transform", colorMap[color])}>
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{description}</p>
      </div>
    </div>
  );
}