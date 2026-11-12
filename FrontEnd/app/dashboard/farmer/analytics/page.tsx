"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  TrendingUp, Target, Lightbulb, Calendar,
  ArrowUpRight, Info, Loader2, PieChart as PieIcon,
  AlertTriangle, Filter, Sparkles
} from "lucide-react";
import api from "@/services/api";
import { useUser, FarmerProfile } from "@/hooks/useUser";
import { useLanguage } from "@/context/LanguageContext";
import { getCropDisplayName } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CROP_OPTIONS, SYSTEM_SUPPORT_INFO } from "@/lib/constants";

export default function FarmerAnalytics() {
  const { profile, isFarmer } = useUser();
  const { t, language } = useLanguage();
  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;

  // State to control which crop we are analyzing
  const [selectedCrop, setSelectedCrop] = useState("Maize");

  // 1. Fetch Platform Overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await api.get("/analytics/overview");
      return res.data;
    },
  });

  // 2. Fetch Market Gaps (Planting Recommendations)
  const { data: marketGaps, isLoading: gapsLoading } = useQuery({
    queryKey: ["market-gaps"],
    queryFn: async () => {
      const res = await api.get("/analytics/market-gaps");
      return res.data;
    },
  });

  // 3. Fetch Historical Price Trends for the selected crop
  const { data: priceTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["price-trends", selectedCrop],
    queryFn: async () => {
      const res = await api.get(`/analytics/price-trends/${selectedCrop}`);
      return res.data;
    },
    enabled: !!selectedCrop,
  });

  // 4. Fetch Regional Activity
  const { data: regions } = useQuery({
    queryKey: ["regional-activity"],
    queryFn: async () => {
      const res = await api.get("/analytics/regional-activity");
      return res.data;
    },
  });

  if (overviewLoading || gapsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-700 mx-auto" size={40} />
          <p className="text-slate-500 font-medium animate-pulse">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const selectedCropDisplayName = getCropDisplayName(selectedCrop, language);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- Page Header & Crop Filter --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.analytics.title}</h1>
          <p className="text-slate-500 font-medium mt-1">
            {t.analytics.subtitle} ({farmerProfile?.district || t.common.rwanda})
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none pr-8 cursor-pointer"
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.id} value={c.name}>
                {getCropDisplayName(c.name, language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Top Insight Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-white border-l-4 border-green-600 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.farmerDashboard.totalRevenueTitle}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.market?.gmv_rwf?.toLocaleString() || "0"} <span className="text-xs font-normal text-slate-500 uppercase">{t.common.rwf}</span>
              </h2>
            </div>
            <div className="p-2 bg-green-50 text-green-700 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[11px] text-green-600 font-bold mt-4">{t.farmerDashboard.totalRevenueDesc}</p>
        </div>

        <div className="card p-6 bg-white border-l-4 border-amber-500 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.farmerDashboard.activeListingsTitle}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.inventory?.active_listings || "0"} <span className="text-xs font-normal text-slate-500 uppercase">{t.common.available}</span>
              </h2>
            </div>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Target size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-4">{t.farmerDashboard.activeListingsDesc}</p>
        </div>

        <div className="card p-6 bg-white border-l-4 border-blue-600 rounded-3xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.common.buyer}</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.users?.buyers || "0"} <span className="text-xs font-normal text-slate-500 uppercase">{t.common.verified}</span>
              </h2>
            </div>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-4">{t.farmerDashboard.marketReachDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Chart: Historical Price Trends --- */}
        <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              {selectedCropDisplayName} • {t.analytics.priceTrendTitle}
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold uppercase">{t.common.rwfPerKg}</span>
          </div>
          <div className="h-72">
            {trendsLoading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceTrends}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="avg_price" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- Market Gaps (Opportunities) --- */}
        <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-yellow-100 text-yellow-800 rounded-xl">
              <Lightbulb size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{t.analytics.marketGapsTitle}</h3>
              <p className="text-xs text-slate-500">{t.analytics.marketGapsSubtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {marketGaps?.map((gap: any, i: number) => {
              const gapCropDisplay = getCropDisplayName(gap.crop_type, language);
              return (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-black text-xs flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{gapCropDisplay}</h4>
                      <p className="text-xs text-slate-500 font-medium">{gap.reason || "High demand in eastern and northern districts"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                    {t.analytics.highDemand}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
