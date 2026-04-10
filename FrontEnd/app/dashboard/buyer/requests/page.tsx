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
  TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";

// Modular Services & Hooks
import { matchingService } from "@/services/matching";
import { listingsService } from "@/services/listings"; // Used for fetching unit suggestions
import { useUser, BuyerProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import api from "@/services/api";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buyerProfile = isBuyer ? (profile as BuyerProfile) : null;

  // 2. Query: Fetch active procurement matches (Demand-based suggestions)
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["buyer-requests"],
    queryFn: matchingService.getBuyerSuggestions,
    enabled: isBuyer,
  });

  // 3. Form Setup
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      preferred_district: buyerProfile?.base_district || "" // Fixed!
    }
  });

  // 4. Mutation: Post New Procurement Demand
  const postRequestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      // In our architecture, posting demand creates a 'BuyerRequest' record
      // that the Matching Service scans.
      const res = await api.post("/buyers/requests", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-requests"] });
      toast.success("Demand broadcasted! AI is scanning farmer listings.");
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
        <h2 className="text-xl font-bold">Buyer Access Only</h2>
        <p className="text-slate-500">Please log in as a buyer to manage procurement requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement Requests</h1>
          <p className="text-slate-500 text-sm font-medium">Active demands being matched by AI.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> Post New Demand
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
            <div className="card p-16 text-center border-dashed border-2 flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <ClipboardList className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-500 font-bold">No active procurement matches.</p>
              <p className="text-slate-400 text-sm mt-1 mb-6">Broadcast your needs to get AI farmer matches.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-green-700 font-black text-sm flex items-center gap-2 hover:underline"
              >
                Create your first request <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            requests.map((match: any) => (
              <div key={match.id} className="card p-6 hover:border-green-300 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ClipboardList size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">Demand for {match.listing?.crop_type || "Produce"}</h3>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                      match.status === "interested" ? "bg-green-50 text-green-700 border-green-100" : "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {match.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><Scale size={14} className="text-slate-400" /> {match.listing?.quantity_kg?.toLocaleString()} kg</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {match.other_party_district}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {new Date(match.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                    <BrainCircuit size={16} className="text-green-700" />
                    <span className="text-xs font-black text-green-800">AI Match: {Math.round(match.match_score * 100)}%</span>
                  </div>
                  <button className="w-full md:w-fit px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">
                    View Potential Suppliers
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- Modal: Post Demand --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-700 text-white rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Broadcast Demand</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit((data) => postRequestMutation.mutate(data))} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Crop Type</label>
                  <select {...register("crop_type")} className="input-field">
                    <option value="">Select Crop</option>
                    <option value="Maize">Maize</option>
                    <option value="Beans">Beans</option>
                    <option value="Potato">Potato</option>
                    <option value="Rice">Rice</option>
                  </select>
                  {errors.crop_type && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.crop_type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sourcing District</label>
                  <input {...register("preferred_district")} placeholder="e.g., Kayonza" className="input-field" />
                  {errors.preferred_district && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.preferred_district.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Volume Needed (KG)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="number"
                    {...register("required_kg", { valueAsNumber: true })}
                    className="input-field pl-10"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Max Budget (RWF/kg)</label>
                <input
                  type="number"
                  {...register("max_price_per_kg", { valueAsNumber: true })}
                  className="input-field text-lg font-black text-green-700"
                />
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                  <BrainCircuit size={12} className="text-green-600" />
                  AI insight: Current average market price is <span className="font-bold text-slate-700">310 RWF/kg</span>.
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 font-bold text-slate-600 hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postRequestMutation.isPending}
                  className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2 rounded-2xl shadow-lg"
                >
                  {postRequestMutation.isPending ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>Broadcast to Farmers <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}