"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Package,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

// Modular Services & Hooks
import { matchingService, MatchDetail } from "@/services/matching";
import { listingsService, Listing } from "@/services/listings";
import { useUser, BuyerProfile } from "@/hooks/useUser";
import { useLanguage } from "@/context/LanguageContext";
import { getCropDisplayName } from "@/lib/i18n";
import { CropCard } from "@/components/CropCard";
import { BargainModal } from "@/components/BargainModal";
import { cn } from "@/lib/utils";
import { RWANDA_DISTRICTS } from "@/lib/constants";

export default function BuyerDashboard() {
  const queryClient = useQueryClient();
  const { profile, isBuyer, isLoading: userLoading } = useUser();
  const { t, language } = useLanguage();

  const buyerProfile = isBuyer ? (profile as BuyerProfile) : null;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) setSearchTerm(q);
      const d = params.get("district");
      if (d) setDistrictFilter(d);
    }
  }, []);

  // Active negotiation modal state
  const [activeChatMatch, setActiveChatMatch] = useState<{
    matchId: number;
    crop: string;
    quantity?: number;
    askingPrice?: number;
    district?: string;
    farmerName: string;
    farmerPhone?: string;
    status?: string;
  } | null>(null);

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

  // 3. Query: Fetch All Active Buyer Matches
  const { data: myMatches } = useQuery({
    queryKey: ["my-buyer-matches"],
    queryFn: matchingService.getMyBuyerMatches,
    enabled: isBuyer,
  });

  // Map listingId -> match detail for quick lookup
  const matchesByListingId = useMemo(() => {
    const map = new Map<number, MatchDetail>();
    if (myMatches) {
      for (const m of myMatches) {
        map.set(m.listing_id, m);
      }
    }
    return map;
  }, [myMatches]);

  // 4. Mutation: The "Handshake" Interest Expression (for AI matches)
  const interestMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: string }) =>
      matchingService.updateMatchStatus(matchId, status),
    onSuccess: (updatedMatch) => {
      queryClient.invalidateQueries({ queryKey: ["buyer-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["my-buyer-matches"] });
      toast.success(t.cropCard.interestSent);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to notify farmer");
    }
  });

  // 5. Mutation: Direct interest on un-matched listing
  const [pendingListingId, setPendingListingId] = useState<number | null>(null);
  const listingInterestMutation = useMutation({
    mutationFn: async (listing: Listing) => {
      setPendingListingId(listing.id);
      return matchingService.expressInterest({ listing_id: listing.id });
    },
    onSuccess: (newMatch) => {
      queryClient.invalidateQueries({ queryKey: ["buyer-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["my-buyer-matches"] });
      toast.success(t.cropCard.interestSent);
      setPendingListingId(null);
    },
    onError: (err: any) => {
      setPendingListingId(null);
      toast.error(err?.response?.data?.detail || "Failed to notify farmer");
    }
  });

  // Access Control Guard
  if (!userLoading && !isBuyer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">{t.buyerDashboard.accessDenied}</h2>
        <p className="text-slate-500">{t.buyerDashboard.accessDeniedDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- Page Header & Sourcing Pulse --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.buyerDashboard.title}</h1>
          <p className="text-slate-500 font-medium mt-1">
            {t.buyerDashboard.subtitle}
          </p>
        </div>

        {/* Global Search & District Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t.buyerDashboard.searchPlaceholder}
              className="input-field pl-9 h-10 text-xs w-full bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select
              className="input-field pl-9 h-10 text-xs w-full bg-white shadow-sm"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="">{t.buyerDashboard.allDistricts}</option>
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- AI Suggestions Section --- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-yellow-500 fill-yellow-500" size={20} />
              {t.buyerDashboard.aiSuggestionsTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t.buyerDashboard.aiSuggestionsSubtitle}
            </p>
          </div>
        </div>

        {suggestionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : suggestions && suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((match: MatchDetail) => (
              <SuggestionCard
                key={match.id}
                match={match}
                language={language}
                t={t}
                onInterest={() => interestMutation.mutate({ matchId: match.id, status: "interested" })}
                onChat={() => setActiveChatMatch({
                  matchId: match.id,
                  crop: match.crop_type || "Produce",
                  quantity: match.quantity_kg,
                  askingPrice: match.asking_price,
                  district: match.other_party_district,
                  farmerName: match.other_party_name,
                  farmerPhone: match.other_party_phone,
                  status: match.status
                })}
                isPending={interestMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center bg-slate-50 border-dashed border-2 rounded-3xl">
            <Package className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-500 font-medium italic text-xs">
              {t.buyerDashboard.noSuggestions}
            </p>
          </div>
        )}
      </section>

      {/* --- General Marketplace Section --- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t.buyerDashboard.allHarvestsTitle}</h2>
          <p className="text-xs text-slate-500 font-medium">{t.buyerDashboard.allHarvestsSubtitle}</p>
        </div>

        {listingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings?.map((listing: Listing) => {
              const existingMatch = matchesByListingId.get(listing.id);
              const isInterested = existingMatch?.status === "interested" || existingMatch?.status === "accepted";
              const isPending = pendingListingId === listing.id;

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
                  image_url={listing.image_url}
                  role="buyer"
                  created_at={listing.created_at}
                  onInterest={() => listingInterestMutation.mutate(listing)}
                  onChat={existingMatch ? () => setActiveChatMatch({
                    matchId: existingMatch.id,
                    crop: listing.crop_type,
                    quantity: listing.quantity_kg,
                    askingPrice: listing.asking_price,
                    district: listing.district,
                    farmerName: existingMatch.other_party_name || `Farmer in ${listing.district}`,
                    farmerPhone: existingMatch.other_party_phone,
                    status: existingMatch.status
                  }) : undefined}
                  isPending={isPending}
                  isInterested={isInterested}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* --- Bargain & Chat Modal --- */}
      {activeChatMatch && (
        <BargainModal
          isOpen={!!activeChatMatch}
          onClose={() => setActiveChatMatch(null)}
          matchId={activeChatMatch.matchId}
          listingCrop={activeChatMatch.crop}
          listingQuantity={activeChatMatch.quantity}
          listingAskingPrice={activeChatMatch.askingPrice}
          listingDistrict={activeChatMatch.district}
          otherPartyName={activeChatMatch.farmerName}
          otherPartyPhone={activeChatMatch.farmerPhone}
          otherPartyRole="Farmer"
          currentMatchStatus={activeChatMatch.status}
        />
      )}
    </div>
  );
}

/**
 * Specialized SuggestionCard for AI Handshakes
 */
function SuggestionCard({ match, language, t, onInterest, onChat, isPending }: {
  match: MatchDetail;
  language: any;
  t: any;
  onInterest: () => void;
  onChat: () => void;
  isPending: boolean;
}) {
  const isInterested = match.status === "interested" || match.status === "accepted";
  const displayCrop = getCropDisplayName(match.crop_type || "Produce", language);

  return (
    <div className="card relative border-green-200 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="absolute top-0 right-0 bg-green-700 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm">
        {Math.round(match.match_score * 100)}% {t.cropCard.match}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 text-green-700">
          <ShieldCheck size={18} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{t.buyerDashboard.verifiedSupplier}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 group-hover:text-green-700 transition-colors">
          {match.other_party_name}
        </h3>
        <p className="text-slate-500 text-sm flex items-center gap-1 mb-2 font-medium">
          <MapPin size={14} className="text-slate-400" /> {match.other_party_district}
        </p>

        <p className="text-xs font-bold text-slate-700 mb-4">
          {displayCrop} • {match.quantity_kg?.toLocaleString()} {t.common.kg} @ {match.asking_price?.toLocaleString()} {t.common.rwfPerKg}
        </p>

        <div className="p-3 bg-slate-50 rounded-2xl mb-6 border border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.buyerDashboard.aiRecommendation}</p>
          <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
            "{match.explanation || match.match_reason}"
          </p>
        </div>

        {isInterested ? (
          <div className="flex gap-2">
            <div className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> {t.cropCard.alerted}
            </div>
            <button
              onClick={onChat}
              className="flex-1 py-2.5 rounded-xl bg-green-700 text-white hover:bg-green-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <MessageSquare size={16} /> {t.cropCard.bargain}
            </button>
          </div>
        ) : (
          <button
            onClick={onInterest}
            disabled={isPending}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
              "bg-green-700 text-white hover:bg-green-800 active:scale-95",
              isPending && "opacity-70"
            )}
          >
            {isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>{t.cropCard.expressInterest} <ShoppingCart size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
