"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Calendar, 
  ArrowUpRight, 
  Info,
  Loader2,
  PieChart as PieIcon,
  AlertCircle,
  TrendingDown
} from "lucide-react";

// Modular Services, Hooks & Components
import { analyticsService } from "@/services/analytics";
import { useUser, FarmerProfile } from "@/hooks/useUser";
import { useMarketAI } from "@/hooks/useMarketAI";
import { RevenueAreaChart, ComparisonBarChart } from "@/components/Charts";
import { cn } from "@/lib/utils";


// Mock Data for Revenue (In production, this comes from a time-series endpoint)
const revenueData = [
  { month: "Jul", revenue: 450000 },
  { month: "Aug", revenue: 520000 },
  { month: "Sep", revenue: 480000 },
  { month: "Oct", revenue: 610000 },
  { month: "Nov", revenue: 850000 },
  { month: "Dec", revenue: 920000 },
];

export default function FarmerAnalytics() {
  const { profile, isFarmer, isLoading: userLoading } = useUser();
  const { useMarketGaps } = useMarketAI();

  // 1. Query: Fetch Personal Performance Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["farmer-stats"],
    queryFn: analyticsService.getFarmerStats,
    enabled: isFarmer,
  });

  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;

  // 2. Query: Fetch AI Market Opportunities (Planting Advice)
  const { data: marketGaps, isLoading: gapsLoading } = useMarketGaps();

  // Guard: Unauthorized access
  if (!userLoading && !isFarmer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 max-w-xs">Business analytics are only available for verified farmer accounts.</p>
      </div>
    );
  }

  if (userLoading || statsLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-green-700 mx-auto" size={48} />
          <p className="text-slate-500 font-medium animate-pulse">Analyzing market trends...</p>
        </div>
      </div>
    );
  }

  // Sample comparison data mapped to component needs
  const cropComparison = [
    { name: "Maize", yourPrice: 350, marketAvg: 310 },
    { name: "Beans", yourPrice: 600, marketAvg: 640 },
    { name: "Potatoes", yourPrice: 220, marketAvg: 215 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Farm Performance</h1>
          <p className="text-slate-500 font-medium mt-1">AI-driven insights for {farmerProfile?.district} District.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Season B 2025</span>
        </div>
      </div>

      {/* --- Top Insight Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard 
          title="Avg. Sale Price" 
          value="450 RWF/kg" 
          subValue="+8.2% vs last month"
          isPositive={true}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <InsightCard 
          title="Conversion Rate" 
          value="92%" 
          subValue="Match acceptance speed"
          isPositive={true}
          icon={<Target size={20} />}
          color="amber"
        />
        <InsightCard 
          title="Market Reach" 
          value={stats?.market_reach || 0} 
          subValue="Unique districts sold to"
          isPositive={true}
          icon={<ArrowUpRight size={20} />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- Chart: Revenue Growth (Modular Area Chart) --- */}
        <div className="card p-6 bg-white">
          <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" />
            Projected Revenue Growth
          </h3>
          <div className="h-72">
            <RevenueAreaChart data={revenueData} />
          </div>
        </div>

        {/* --- Chart: Price Comparison (Modular Bar Chart) --- */}
        <div className="card p-6 bg-white">
          <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
            <PieIcon size={18} className="text-blue-600" />
            National Price Benchmarking
          </h3>
          <div className="h-72">
            <ComparisonBarChart data={cropComparison} />
          </div>
        </div>
      </div>

      {/* --- AI Planting Advice & Market Gaps --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lightbulb size={120} />
          </div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-yellow-400 rounded-lg text-slate-900">
              <Lightbulb size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Planting Advice</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Recommended for next cycle</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {gapsLoading ? (
              [1, 2].map(n => <div key={n} className="h-32 bg-slate-800 animate-pulse rounded-2xl" />)
            ) : (
              marketGaps?.map((gap: any, i: number) => (
                <div key={i} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 hover:border-yellow-400/50 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-black text-yellow-400 uppercase tracking-widest">{gap.crop}</span>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-bold uppercase">Scarcity Alert</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Buyer interest is <span className="text-white font-bold">{gap.unsatisfied_buyer_interest}x higher</span> than local supply in your sector.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-500"/> Plant by Jan</span>
                    <span className="text-green-400 group-hover:underline cursor-default">ROI +22%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- Market Tips & Strategic Advice --- */}
        <div className="card p-6 bg-white">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Info size={18} className="text-slate-400" />
            Market Intelligence
          </h3>
          <ul className="space-y-6">
            <li className="flex gap-3">
              <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block mb-1 uppercase text-[10px] tracking-widest">Pricing Strategy</strong>
                Wholesalers in Kigali are currently offering a <span className="text-green-700 font-bold">5% premium</span> for moisture-tested Maize.
              </p>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block mb-1 uppercase text-[10px] tracking-widest">Quality Control</strong>
                Moisture content for Beans must be below <span className="text-slate-900 font-bold">13%</span> to qualify for Exporter matches.
              </p>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block mb-1 uppercase text-[10px] tracking-widest">AI Forecast</strong>
                Potato prices are projected to <span className="text-blue-700 font-bold italic">stabilize</span> in late March.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Specialized Insight Card ---
function InsightCard({ title, value, subValue, isPositive, icon, color }: any) {
  const colors: any = {
    green: "border-green-600 text-green-700 bg-green-50",
    amber: "border-amber-500 text-amber-700 bg-amber-50",
    blue: "border-blue-600 text-blue-700 bg-blue-50",
  };

  return (
    <div className={cn("card p-6 bg-white border-l-4", colors[color])}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h2>
        </div>
        <div className={cn("p-2 rounded-xl", colors[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {isPositive ? <TrendingUp size={12} className="text-green-600" /> : <TrendingDown size={12} className="text-red-500" />}
        <p className={cn("text-[11px] font-bold", isPositive ? "text-green-600" : "text-red-500")}>
          {subValue}
        </p>
      </div>
    </div>
  );
}