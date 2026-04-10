"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  TrendingUp, 
  Map as MapIcon, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Package,
  Activity,
  Globe2,
  BarChart as BarIcon,
  Download
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from "recharts";

// Integrated Services & Hooks
import { analyticsService } from "@/services/analytics";
import { useUser } from "@/hooks/useUser";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const COLORS = ['#15803d', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { profile, isAdmin, isLoading: userLoading } = useUser();

  // 1. Fetch High-Level Overview (GMV, Users, Inventory)
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: analyticsService.getSystemOverview,
    enabled: isAdmin, // Only fetch if user is confirmed admin
  });
  
  const { data: logs, isLoading } = useAuditLogs();
  // 2. Fetch Regional Supply/Demand Activity
  const { data: regionsRaw, isLoading: regionsLoading } = useQuery({
    queryKey: ["admin-regional"],
    queryFn: analyticsService.getRegionalActivity,
    enabled: isAdmin,
  });
  // Defensive: ensure regions is always an array
  const regions = Array.isArray(regionsRaw) ? regionsRaw : [];

  // 3. Fetch AI Market Gaps (Supply Deficits)
  const { data: marketGaps } = useQuery({
    queryKey: ["admin-market-gaps"],
    queryFn: analyticsService.getMarketGaps,
    enabled: isAdmin,
  });

  const handleDownloadReport = () => {
    toast.success("Generating latest market report...");
    // In production, this would trigger a CSV/PDF generation endpoint
  };

  // Guard: Unauthorized access
  if (!userLoading && !isAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertTriangle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-slate-500">You do not have administrative privileges.</p>
      </div>
    );
  }

  if (overviewLoading || userLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-700 mx-auto" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Syncing Global Market Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* --- Admin Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Globe2 className="text-green-700" /> System Overview
          </h1>
          <p className="text-slate-500">Welcome back, {profile?.full_name || "Administrator"}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download size={18} /> Export Data
          </button>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm">
            <Activity className="text-green-600" size={18} />
            <span className="text-sm font-bold text-green-800">AI Core: <span className="text-green-600 uppercase">Online</span></span>
          </div>
        </div>
      </div>

      {/* --- Top Level KPI Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard 
          title="Platform GMV" 
          value={`${(overview?.market_performance?.gmv_rwf || 0).toLocaleString()} RWF`} 
          change="+14.5%"
          isUp={true}
          icon={<TrendingUp className="text-green-600" />} 
          description="Total trade value"
        />
        <AdminStatCard 
          title="Active Users" 
          value={overview?.user_base?.total || 0} 
          change={`${overview?.user_base?.farmers || 0} Farmers`}
          isUp={true}
          icon={<Users className="text-blue-600" />} 
          description="Buyers & Farmers"
        />
        <AdminStatCard 
          title="Trade Volume" 
          value={`${(overview?.market_performance?.volume_kg || 0).toLocaleString()} KG`} 
          change="-2.1%"
          isUp={false}
          icon={<Package className="text-amber-600" />} 
          description="Total weight moved"
        />
        <AdminStatCard 
          title="Market Liquidity" 
          value={overview?.current_inventory?.active_listings || 0} 
          change="Available listings"
          isUp={true}
          icon={<Activity className="text-purple-600" />} 
          description="Open harvests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Regional Supply Activity Table --- */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapIcon size={18} className="text-green-700" /> Regional Supply Intensity
            </h3>
            <span className="text-xs text-slate-400 font-medium">Updated every 5 mins</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">District</th>
                  <th className="px-4 py-3 text-center">Active Stock</th>
                  <th className="px-4 py-3">Market Vibrancy</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regionsLoading ? (
                  [1,2,3].map(n => <tr key={n}><td colSpan={4} className="h-12 bg-slate-50/50 animate-pulse"></td></tr>)
                ) : (
                  regions.map((reg: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{reg.district}</td>
                      <td className="px-4 py-4 text-center text-slate-600 font-medium">{reg.available_stock_kg.toLocaleString()} kg</td>
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.min(reg.market_vibrancy_score * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{Math.min(reg.market_vibrancy_score * 10, 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                          reg.available_stock_kg > 5000 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {reg.available_stock_kg > 5000 ? "Stable" : "Scarcity Risk"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- AI Market Gap Analysis --- */}
        <div className="card p-6 bg-slate-900 text-white border-none shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="text-yellow-400" size={20} />
            <h3 className="text-lg font-bold">Market Gaps (Urgent)</h3>
          </div>
          
          <div className="space-y-4">
            {marketGaps?.map((gap: any, i: number) => (
              <div key={i} className="group p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{gap.crop}</p>
                  <p className="text-sm font-medium mt-1">High Demand Deficit</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-red-400 group-hover:scale-110 transition-transform">{gap.unsatisfied_buyer_interest}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Unmet Matches</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-900/20 rounded-xl border border-blue-700/30 flex gap-3">
            <Activity size={24} className="text-blue-400 shrink-0" />
            <p className="text-[11px] leading-relaxed text-blue-100/80">
              <span className="font-bold text-blue-300 uppercase block mb-1">Policy Insight:</span>
              AI detects high unsatisfied interest for <span className="text-white font-bold">Soybeans</span>. Recommend releasing seed subsidies in Eastern Province.
            </p>
          </div>
        </div>
      </div>

      {/* --- Global Crop Volume Chart --- */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <BarIcon size={18} className="text-blue-600" /> Regional Supply Distribution
          </h3>
          <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-700"></div> High Supply</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Medium</div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="available_stock_kg" radius={[6, 6, 0, 0]} barSize={45}>
                {regions.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ title, value, change, isUp, icon, description }: any) {
  return (
    <div className="card p-6 bg-white hover:border-slate-300 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h2>
        <p className="text-[10px] text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}