"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Package,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

// Modular Services & Hooks
import { matchingService } from "@/services/matching";
import { listingsService } from "@/services/listings";
import { useUser, BuyerProfile } from "@/hooks/useUser";
import { CropCard } from "@/components/CropCard";
import { cn } from "@/lib/utils";

// Add the component function declaration here
export default function BuyerDashboard() {
  const queryClient = useQueryClient();
  const { profile, isBuyer, isLoading: userLoading } = useUser();

  const buyerProfile = isBuyer ? (profile as BuyerProfile) : null;

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");

  // Track interest state for each listing
  const [interestState, setInterestState] = useState<{ [listingId: number]: "idle" | "pending" | "interested" }>({});

  // 1. Query: Fetch AI Personalized Suggestions (High-confidence matches)
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["buyer-suggestions"],
    queryFn: matchingService.getBuyerSuggestions,
    enabled: isBuyer,
  });

  // 2. Query: Fetch General Marketplace Listings
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["marketplace-listings", searchTerm, districtFilter],
    queryFn: () => listingsService.getAllListings({
      crop_type: searchTerm,
      district: districtFilter
    }),
    enabled: isBuyer,
  });

  // 3. Mutation: The "Handshake" Interest Expression (for AI matches)
  const interestMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: string }) =>
      matchingService.updateMatchStatus(matchId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer-suggestions"] });
      toast.success("Interest shared! The farmer has been notified.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Could not process interest.");
    },
  });

  // 4. Mutation: Express interest for general marketplace listings
  const listingInterestMutation = useMutation({
    mutationFn: async (listingId: number) => {
      setInterestState((prev) => ({ ...prev, [listingId]: "pending" }));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return listingId;
    },
    onSuccess: (listingId: number) => {
      setInterestState((prev) => ({ ...prev, [listingId]: "interested" }));
      toast.success("Interest shared! The farmer has been notified.");
    },
    onError: (err: any, listingId: number) => {
      setInterestState((prev) => ({ ...prev, [listingId]: "idle" }));
      toast.error(err?.response?.data?.detail || "Could not process interest.");
    },
  });

  // Single return statement
  return (
    !userLoading && !isBuyer ? (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Buyer Access Only</h2>
        <p className="text-slate-500">Please switch to a buyer account to view the marketplace.</p>
      </div>
    ) : (
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* --- Header & Live Search --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Marketplace</h1>
            <p className="text-slate-500 font-medium">
              Procure quality harvests from {buyerProfile?.base_district || "verified"} farmers.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search crops (e.g. Maize)..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input-field w-40"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="">All Districts</option>
              <option value="Musanze">Musanze</option>
              <option value="Kigali">Kigali</option>
              <option value="Kayonza">Kayonza</option>
              <option value="Nyabihu">Nyabihu</option>
            </select>
          </div>
        </div>

        {/* --- AI Personalized Suggestions Section --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-700" size={20} />
              <h2 className="text-xl font-bold text-slate-900">AI Matches for You</h2>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                Live Confidence
              </span>
            </div>
          </div>

          {suggestionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-slate-100 animate-pulse rounded-2xl border border-slate-200" />
              ))}
            </div>
          ) : suggestions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((match: any) => (
                <SuggestionCard
                  key={match.id}
                  match={match}
                  onInterest={() => interestMutation.mutate({ matchId: match.id, status: "interested" })}
                  isPending={interestMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center bg-slate-50 border-dashed border-2">
              <Package className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 font-medium italic">
                AI is still scanning the market. Try updating your preferred districts in settings.
              </p>
            </div>
          )}
        </section>

        {/* --- General Marketplace Section --- */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">All Available Harvests</h2>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings?.map((listing: any) => {
                const state = interestState[listing.id] || "idle";
                return (
                  <CropCard
                    key={listing.id}
                    id={listing.id}
                    crop_type={listing.crop_type}
                    quantity_kg={listing.quantity_kg}
                    asking_price={listing.asking_price}
                    district={listing.district}
                    status={listing.status}
                    ai_suggested_price={listing.ai_suggested_price}
                    role="buyer"
                    created_at={listing.created_at}
                    onInterest={() => listingInterestMutation.mutate(listing.id)}
                    isPending={state === "pending"}
                    isInterested={state === "interested"}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    )
  );
}

/**
 * Specialized SuggestionCard for AI Handshakes
 */
function SuggestionCard({ match, onInterest, isPending }: any) {
  const isInterested = match.status === "interested";

  return (
    <div className="card relative border-green-200 bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="absolute top-0 right-0 bg-green-700 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-lg shadow-sm">
        {Math.round(match.match_score * 100)}% Match
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 text-green-700">
          <ShieldCheck size={18} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Verified Supplier</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 group-hover:text-green-700 transition-colors">
          {match.other_party_name}
        </h3>
        <p className="text-slate-500 text-sm flex items-center gap-1 mb-4 font-medium">
          <MapPin size={14} className="text-slate-400" /> {match.other_party_district}
        </p>

        <div className="p-3 bg-slate-50 rounded-xl mb-6 border border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">AI Recommendation</p>
          <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
            "{match.match_reason}"
          </p>
        </div>

        <button
          onClick={onInterest}
          disabled={isInterested || isPending}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
            isInterested
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-green-700 text-white hover:bg-green-800 active:scale-95"
          )}
        >
          {isInterested ? (
            <>Shared Interest <CheckCircle2 size={16} /></>
          ) : isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>Express Interest <ShoppingCart size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}