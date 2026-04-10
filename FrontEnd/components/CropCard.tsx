"use client";

import Link from "next/link";
import {
  Sprout,
  MapPin,
  Scale,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  Clock,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------
   Types now MATCH backend ListingRead schema
----------------------------------------------*/
interface CropCardProps {
  id: number;
  crop_type: string;
  quantity_kg: number;
  asking_price: number;
  district: string;
  status: "available" | "matched" | "sold";
  ai_suggested_price?: number | null;
  match_score?: number; // 0–1
  farmer_name?: string;
  role: "farmer" | "buyer";
  created_at?: string;
  image_url?: string | null;
  // Buyer interest props
  onInterest?: () => void;
  isPending?: boolean;
  isInterested?: boolean;
}

export function CropCard({
  id,
  crop_type,
  quantity_kg,
  asking_price,
  district,
  status,
  ai_suggested_price,
  match_score,
  farmer_name,
  role,
  created_at,
  image_url,
  onInterest,
  isPending,
  isInterested,
}: CropCardProps) {
  /* ---------------------------------------------
     Safe numeric helpers
  ----------------------------------------------*/
  const safeQuantity = quantity_kg ?? 0;
  const safePrice = asking_price ?? 0;

  const priceDiff =
    ai_suggested_price && safePrice
      ? ((safePrice - ai_suggested_price) / ai_suggested_price) * 100
      : null;

  return (
    <div className="card group flex flex-col h-full bg-white rounded-2xl border border-slate-200 hover:border-green-300 transition-all">
      {/* Image */}
      {image_url && (
        <div className="h-40 w-full overflow-hidden rounded-t-2xl bg-slate-100 border-b">
          <img
            src={image_url}
            alt={`${crop_type} image`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Status & AI Match */}
      <div className="p-4 pb-0 flex justify-between items-start">
        <span
          className={cn(
            "px-2 py-1 text-[10px] font-bold uppercase rounded border",
            status === "available" &&
            "bg-green-50 text-green-700 border-green-200",
            status === "matched" &&
            "bg-blue-50 text-blue-700 border-blue-200",
            status === "sold" &&
            "bg-slate-100 text-slate-500 border-slate-200"
          )}
        >
          {status}
        </span>

        {role === "buyer" && match_score !== undefined && (
          <span className="flex items-center gap-1 bg-green-700 text-white px-2 py-1 rounded text-[10px] font-bold">
            <BrainCircuit size={10} />
            {Math.round(match_score * 100)}% MATCH
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-green-50 group-hover:text-green-700 transition">
            <Sprout size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{crop_type}</h3>
            {farmer_name && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <ShieldCheck size={12} className="text-blue-500" />
                {farmer_name}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Scale size={14} />
            <span className="font-medium">
              {safeQuantity.toLocaleString()} kg
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} />
            <span className="font-medium">{district}</span>
          </div>

          {created_at && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={12} />
              Listed{" "}
              {new Date(created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="pt-4 border-t flex justify-between items-end">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {role === "farmer" ? "Your Price" : "Asking Price"}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">
                {safePrice.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">RWF/kg</span>
            </div>
          </div>

          {ai_suggested_price && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-green-700 mb-1">
                <BrainCircuit size={12} />
                AI Suggested
              </div>
              <p className="text-sm font-bold text-green-700">
                {ai_suggested_price.toLocaleString()} RWF
              </p>

              {role === "farmer" && priceDiff !== null && (
                <p
                  className={cn(
                    "text-[9px] font-bold",
                    priceDiff > 0 ? "text-amber-600" : "text-green-600"
                  )}
                >
                  {priceDiff > 0
                    ? `+${priceDiff.toFixed(1)}% above market`
                    : `${Math.abs(priceDiff).toFixed(1)}% below market`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="p-4 pt-0">
        {role === "farmer" ? (
          <Link
            href={`/dashboard/farmer/listings/${id}`}
            className="btn-primary w-full flex justify-center items-center gap-2"
          >
            Manage Listing <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition",
              isInterested
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-green-700 text-white hover:bg-green-800 active:scale-95",
              isPending && "opacity-70"
            )}
            onClick={onInterest}
            disabled={isInterested || isPending}
          >
            {isInterested ? (
              <>
                Shared Interest <ShieldCheck size={16} />
              </>
            ) : isPending ? (
              <>
                <Loader size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                Express Interest
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
