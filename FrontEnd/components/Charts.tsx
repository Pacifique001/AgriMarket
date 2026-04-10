"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";

// --- Configuration & Constants ---
const COLORS = ["#15803d", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

const TooltipStyle = {
  borderRadius: "12px",
  border: "none",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  fontSize: "12px",
  padding: "10px",
};

// --- Helper: Client-Side Rendering Wrapper ---
// Recharts relies on 'window'. This prevents Next.js SSR errors.
const ClientSideOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return <div className="h-full w-full bg-slate-50 animate-pulse rounded-xl" />;
  return <>{children}</>;
};

// --- 1. Market Trend Chart (Line) ---
// Used for: Farmer Dashboard, Price Prediction analysis
export function MarketTrendChart({ data }: { data: any[] }) {
  return (
    <ClientSideOnly>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#64748b", fontSize: 11 }} 
            dy={10}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip contentStyle={TooltipStyle} />
          <Line
            type="monotone"
            dataKey="avg"
            name="Avg Price"
            stroke="#15803d"
            strokeWidth={3}
            dot={{ r: 4, fill: "#15803d", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ClientSideOnly>
  );
}

// --- 2. Revenue Growth Chart (Area) ---
// Used for: Farmer Analytics
export function RevenueAreaChart({ data }: { data: any[] }) {
  return (
    <ClientSideOnly>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip contentStyle={TooltipStyle} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#15803d"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ClientSideOnly>
  );
}

// --- 3. Benchmarking Chart (Bar) ---
// Used for: Comparison of Farmer Price vs Market Average
export function ComparisonBarChart({ data }: { data: any[] }) {
  return (
    <ClientSideOnly>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={TooltipStyle} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
          <Bar 
            dataKey="yourPrice" 
            name="Your Price" 
            fill="#15803d" 
            radius={[6, 6, 0, 0]} 
            barSize={32}
          />
          <Bar 
            dataKey="marketAvg" 
            name="Market Avg" 
            fill="#cbd5e1" 
            radius={[6, 6, 0, 0]} 
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </ClientSideOnly>
  );
}

// --- 4. Regional Activity Chart (Multi-color Bar) ---
// Used for: Admin Dashboard
export function RegionalBarChart({ data }: { data: any[] }) {
  return (
    <ClientSideOnly>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="district" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={TooltipStyle} cursor={{ fill: "transparent" }} />
          <Bar dataKey="available_stock_kg" radius={[10, 10, 0, 0]} barSize={50}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ClientSideOnly>
  );
}