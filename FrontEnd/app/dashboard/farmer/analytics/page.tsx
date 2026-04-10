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
  AlertTriangle, Filter
} from "lucide-react";
import api from "@/services/api";
import { useUser, FarmerProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export default function FarmerAnalytics() {
  const { profile, isFarmer } = useUser();
  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;

  // State to control which crop we are analyzing
  const [selectedCrop, setSelectedCrop] = useState("Maize");

  // 1. Fetch Platform Overview (GMV, Volume, etc.)
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

  // 4. Fetch Regional Activity (District Comparison)
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
          <p className="text-slate-500 font-medium animate-pulse">Syncing with AI Market Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Page Header & Crop Filter --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Market Intelligence</h1>
          <p className="text-slate-500 font-medium">Real-time data for {farmerProfile?.district} and nationwide.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none pr-8"
          >
            <option value="Maize">Maize</option>
            <option value="Beans">Beans</option>
            <option value="Potato">Potato</option>
            <option value="Soya">Soya</option>
          </select>
        </div>
      </div>

      {/* --- Top Insight Cards (From /overview) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-white border-l-4 border-green-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform GMV</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.market?.gmv_rwf.toLocaleString()} <span className="text-xs font-normal text-slate-500 uppercase">RWF</span>
              </h2>
            </div>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[11px] text-green-600 font-bold mt-4">Live marketplace circulation</p>
        </div>

        <div className="card p-6 bg-white border-l-4 border-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Listings</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.inventory?.active_listings} <span className="text-xs font-normal text-slate-500 uppercase">Offers</span>
              </h2>
            </div>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Target size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-4">Current nationwide supply</p>
        </div>

        <div className="card p-6 bg-white border-l-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer Volume</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {overview?.users?.buyers} <span className="text-xs font-normal text-slate-500 uppercase">Verified</span>
              </h2>
            </div>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-4">Active procurement agents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Chart: Historical Price Trends (From /price-trends) --- */}
        <div className="card p-6 bg-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              {selectedCrop} Price History (30 Days)
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">RWF / KG</span>
          </div>
          <div className="h-72">
            {trendsLoading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceTrends}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="avg_price" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- Chart: Regional Activity (From /regional-activity) --- */}
        <div className="card p-6 bg-white">
          <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
            <PieIcon size={18} className="text-blue-600" />
            District Supply Intensity
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions?.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="available_stock_kg" name="Available (KG)" fill="#15803d" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- AI Planting Advice (From /market-gaps) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-yellow-400 rounded-lg text-slate-900">
              <Lightbulb size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Strategic Planting Recommendations</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">High ROI Opportunities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {marketGaps?.map((gap: any, i: number) => (
              <div key={i} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 hover:border-yellow-400/50 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-black text-yellow-400 uppercase tracking-widest">{gap.crop}</span>
                  <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                    <TrendingUp size={10} />
                    <span className="text-[10px] font-bold uppercase">High Interest</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  There are <span className="text-white font-bold">{gap.unsatisfied_buyer_interest} active buyers</span> currently matched with zero available supply in this category.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> Season B Target</span>
                  <span className="text-green-400">Profit Potential: High</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Market Tips & Alerts --- */}
        <div className="card p-6 bg-white flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Market Alerts
          </h3>
          <div className="space-y-4 flex-1">
            {/* Note: This maps to the logic from the /market-alerts API endpoint */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs font-bold text-green-800 uppercase tracking-tighter mb-1">Opportunity</p>
              <p className="text-sm text-green-700 font-medium">Prices for {selectedCrop} are trending UP. Consider selling your harvest now.</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-tighter mb-1">Logistics Insight</p>
              <p className="text-sm text-blue-700 font-medium">Strong buyer clusters detected in Nyarugenge and Musanze.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter mb-1">Market Tip</p>
              <p className="text-sm text-slate-600 font-medium italic">Ensure moisture content is below 13% for Maize to attract premium buyers.</p>
            </div>
          </div>
          <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}