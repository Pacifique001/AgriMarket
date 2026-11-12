"use client";

import { getCropImageUrl } from "@/lib/crop-images";
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
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCropCardPriceDiff } from "@/lib/crop-card";
import { useLanguage } from "@/context/LanguageContext";
import { getCropDisplayName } from "@/lib/i18n";

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
  sector?: string | null;
  harvest_date?: string | null;
  onInterest?: () => void;
  onChat?: () => void;
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
  sector,
  harvest_date,
  onInterest,
  onChat,
  isPending,
  isInterested,
}: CropCardProps) {
  const { t, language } = useLanguage();

  const safeQuantity = quantity_kg ?? 0;
  const safePrice = asking_price ?? 0;
  const priceDiff = getCropCardPriceDiff(safePrice, ai_suggested_price);

  const displayCropName = getCropDisplayName(crop_type, language);

  const statusLabel =
    status === "available"
      ? t.cropCard.statusAvailable
      : status === "matched"
      ? t.cropCard.statusMatched
      : t.cropCard.statusSold;

  return (
    <div className="card group flex flex-col h-full bg-white rounded-2xl border border-slate-200 hover:border-green-300 transition-all shadow-sm">
      {/* Image */}
      <div className="h-40 w-full overflow-hidden rounded-t-2xl bg-slate-100 border-b relative">
        <img
          src={getCropImageUrl(crop_type, image_url)}
          alt={`${crop_type} harvest`}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {harvest_date && (
          <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Clock size={10} />
            <span>
              {t.cropCard.ready} {new Date(harvest_date).toLocaleDateString(language === "rw" ? "rw-RW" : "en-US", { month: "short", day: "numeric" })}
            </span>
          </span>
        )}
      </div>

      {/* Status & AI Match */}
      <div className="p-4 pb-0 flex justify-between items-start">
        <span
          className={cn(
            "px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border tracking-wider",
            status === "available" && "bg-green-50 text-green-700 border-green-200",
            status === "matched" && "bg-blue-50 text-blue-700 border-blue-200",
            status === "sold" && "bg-slate-100 text-slate-500 border-slate-200"
          )}
        >
          {statusLabel}
        </span>

        {role === "buyer" && match_score !== undefined && (
          <span className="flex items-center gap-1 bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-tight">
            <BrainCircuit size={10} />
            {Math.round(match_score * 100)}% {t.cropCard.match.toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-green-50 text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Sprout size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{displayCropName}</h3>
            {farmer_name && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <ShieldCheck size={12} className="text-blue-500" />
                {farmer_name}
              </p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Scale size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-800">
              {safeQuantity.toLocaleString()} {t.common.kg}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span className="font-medium truncate">{district}{sector ? `, ${sector}` : ""}</span>
          </div>

          {created_at && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={12} />
              <span>
                {t.cropCard.listed}{" "}
                {new Date(created_at).toLocaleDateString(language === "rw" ? "rw-RW" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              {role === "farmer" ? t.cropCard.yourPrice : t.cropCard.askingPrice}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {safePrice.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">{t.common.rwfPerKg}</span>
            </div>
          </div>

          {ai_suggested_price && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-green-700 mb-1">
                <BrainCircuit size={12} />
                <span>{t.cropCard.aiSuggested}</span>
              </div>
              <p className="text-sm font-bold text-green-700">
                {ai_suggested_price.toLocaleString()} {t.common.rwf}
              </p>

              {role === "farmer" && priceDiff !== null && (
                <p
                  className={cn(
                    "text-[9px] font-bold",
                    priceDiff > 0 ? "text-amber-600" : "text-green-600"
                  )}
                >
                  {priceDiff > 0
                    ? `+${priceDiff.toFixed(1)}% ${t.cropCard.aboveMarket}`
                    : `${Math.abs(priceDiff).toFixed(1)}% ${t.cropCard.belowMarket}`}
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
            className="btn-primary w-full flex justify-center items-center gap-2 shadow-sm"
          >
            {t.cropCard.manageListing} <ArrowRight size={16} />
          </Link>
        ) : isInterested ? (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold bg-green-50 text-green-700 border border-green-200 text-xs">
              <ShieldCheck size={15} /> {t.cropCard.interestSent}
            </div>
            {onChat && (
              <button
                type="button"
                onClick={onChat}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold bg-green-700 text-white hover:bg-green-800 active:scale-95 text-xs transition-all shadow-sm"
              >
                <MessageSquare size={14} /> {t.cropCard.bargain}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition shadow-sm",
              "bg-green-700 text-white hover:bg-green-800 active:scale-95",
              isPending && "opacity-70"
            )}
            onClick={onInterest}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader size={16} className="animate-spin" />
                {t.cropCard.sending}
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                {t.cropCard.expressInterest}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
