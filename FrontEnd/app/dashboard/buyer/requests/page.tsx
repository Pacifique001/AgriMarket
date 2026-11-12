"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  ClipboardList,
  MapPin,
  Scale,
  Clock,
  Loader2,
  X,
  BrainCircuit,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";

// Modular Services & Hooks
import { matchingService } from "@/services/matching";
import { useUser, BuyerProfile } from "@/hooks/useUser";
import { useLanguage } from "@/context/LanguageContext";
import { getCropDisplayName } from "@/lib/i18n";
import { BargainModal } from "@/components/BargainModal";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { RWANDA_DISTRICTS, CROP_OPTIONS } from "@/lib/constants";

// 1. Validation Schema for Buyer Demand
const requestSchema = z.object({
  crop_type: z.string().min(2, "Select a crop type"),
  required_kg: z.number().min(1, "Quantity must be at least 1kg"),
  preferred_district: z.string().min(2, "District is required"),
  max_price_per_kg: z.number().min(1, "Budget price is required"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function BuyerRequestsPage() {
  const queryClient = useQueryClient();
  const { isBuyer, isLoading: userLoading, profile } = useUser();
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBargainMatch, setActiveBargainMatch] = useState<any>(null);

  const buyerProfile = isBuyer ? (profile as BuyerProfile) : null;

  // 2. Query: Fetch active procurement matches
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["buyer-requests"],
    queryFn: matchingService.getBuyerSuggestions,
    enabled: isBuyer,
  });

  // 3. Form Setup
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      preferred_district: buyerProfile?.base_district || ""
    }
  });

  // 4. Mutation: Post New Procurement Demand
  const postRequestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const res = await api.post("/buyers/requests", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-requests"] });
      toast.success(t.common.verified);
      setIsModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to broadcast request.");
    },
  });

  // Role Guard
  if (!userLoading && !isBuyer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold">{t.buyerDashboard.accessDenied}</h2>
        <p className="text-slate-500">{t.buyerDashboard.accessDeniedDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.procurement.title}</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">{t.procurement.subtitle}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 shadow-lg px-5 py-3 rounded-xl active:scale-95 transition"
        >
          <Plus size={18} /> {t.procurement.postDemandButton}
        </button>
      </div>

      {/* --- Active Requests / Matches List --- */}
      {requestsLoading ? (
        <div className="space-y-4">
          {[1, 2].map(n => <div key={n} className="h-32 bg-slate-50 animate-pulse rounded-2xl border" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {requests?.length === 0 ? (
            <div className="card p-16 text-center border-dashed border-2 rounded-3xl flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <ClipboardList className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-700 font-bold text-lg">{t.procurement.noRequestsTitle}</p>
              <p className="text-slate-400 text-sm mt-1 mb-6 max-w-sm">{t.procurement.noRequestsDesc}</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition"
              >
                {t.procurement.postDemandButton} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            requests?.map((match: any) => {
              const cropRaw = match.crop_type || match.listing?.crop_type || "Harvest";
              const displayCrop = getCropDisplayName(cropRaw, language);
              return (
                <div key={match.id} className="card p-6 rounded-3xl hover:border-green-300 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group shadow-sm bg-white">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ClipboardList size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">
                        {displayCrop}
                      </h3>
                      <span className={cn(
                        "text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border",
                        match.status === "interested" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {match.status === "interested" ? t.cropCard.interestSent : match.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Scale size={14} className="text-slate-400" /> {(match.quantity_kg || match.listing?.quantity_kg || 0).toLocaleString()} {t.common.kg}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400" /> {match.other_party_district}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" /> {new Date(match.created_at).toLocaleDateString(language === "rw" ? "rw-RW" : "en-US")}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                      <BrainCircuit size={16} className="text-green-700" />
                      <span className="text-xs font-black text-green-800">{t.cropCard.match}: {Math.round(match.match_score * 100)}%</span>
                    </div>
                    <button
                      onClick={() => setActiveBargainMatch(match)}
                      className="w-full md:w-fit px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare size={14} /> {t.cropCard.bargain}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- Modal: Post Demand --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-700 text-white rounded-xl">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{t.procurement.modalTitle}</h2>
                  <p className="text-xs text-slate-500">{t.procurement.modalSubtitle}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit((data) => postRequestMutation.mutate(data))} className="p-6 md:p-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.procurement.cropTypeLabel}</label>
                  <select {...register("crop_type")} className="input-field text-sm">
                    <option value="">{t.procurement.selectCrop}</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c.id} value={c.name}>
                        {getCropDisplayName(c.name, language)}
                      </option>
                    ))}
                  </select>
                  {errors.crop_type && <p className="text-[11px] text-red-500 font-medium">{errors.crop_type.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.procurement.preferredDistrict}</label>
                  <select {...register("preferred_district")} className="input-field text-sm">
                    <option value="">{t.farmerListings.selectDistrict}</option>
                    {RWANDA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.preferred_district && <p className="text-[11px] text-red-500 font-medium">{errors.preferred_district.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.procurement.requiredVolume}</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    {...register("required_kg", { valueAsNumber: true })}
                    className="input-field text-sm"
                  />
                  {errors.required_kg && <p className="text-[11px] text-red-500 font-medium">{errors.required_kg.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t.procurement.budgetPrice}</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    {...register("max_price_per_kg", { valueAsNumber: true })}
                    className="input-field text-sm"
                  />
                  {errors.max_price_per_kg && <p className="text-[11px] text-red-500 font-medium">{errors.max_price_per_kg.message}</p>}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={postRequestMutation.isPending}
                  className="flex-1 btn-primary py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition text-sm"
                >
                  {postRequestMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {t.procurement.broadcastCta}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Bargain & Chat Modal --- */}
      {activeBargainMatch && (
        <BargainModal
          isOpen={!!activeBargainMatch}
          onClose={() => setActiveBargainMatch(null)}
          matchId={activeBargainMatch.id}
          listingCrop={activeBargainMatch.crop_type || activeBargainMatch.listing?.crop_type || "Harvest"}
          listingQuantity={activeBargainMatch.quantity_kg || activeBargainMatch.listing?.quantity_kg}
          listingAskingPrice={activeBargainMatch.asking_price || activeBargainMatch.listing?.asking_price}
          listingDistrict={activeBargainMatch.other_party_district}
          otherPartyName={activeBargainMatch.other_party_name}
          otherPartyPhone={activeBargainMatch.other_party_phone}
          otherPartyRole="Farmer"
          currentMatchStatus={activeBargainMatch.status}
        />
      )}
    </div>
  );
}
