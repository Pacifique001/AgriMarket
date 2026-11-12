"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  Sparkles,
  ClipboardList,
  Store,
  ArrowRight,
  RotateCcw
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
  const [selectedCropChip, setSelectedCropChip] = useState("All");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) {
        setSearchTerm(q);
        setSelectedCropChip(q);
      }
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
  const { data: rawListings, isLoading: listingsLoading } = useQuery({
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

  // Filter listings by selected crop chip if active
  const listings = useMemo(() => {
    if (!rawListings) return [];
    if (selectedCropChip === "All") return rawListings;
    return rawListings.filter((l) =>
      l.crop_type.toLowerCase().includes(selectedCropChip.toLowerCase())
    );
  }, [rawListings, selectedCropChip]);

  // 4. Mutation: The "Handshake" Interest Expression (for AI matches)
  const interestMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: string }) =>
      matchingService.updateMatchStatus(matchId, status),
    onSuccess: () => {
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
    onSuccess: () => {
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

  // Quick crop filters
  const cropChips = [
    { key: "All", label: t.buyerDashboard.filterAll },
    { key: "Maize", label: t.liveHarvests.filterMaize },
    { key: "Beans", label: t.liveHarvests.filterBeans },
    { key: "Potato", label: t.liveHarvests.filterPotato },
    { key: "Rice", label: t.liveHarvests.filterRice },
    { key: "Cassava", label: t.liveHarvests.filterCassava },
  ];

  const handleChipClick = (key: string) => {
    setSelectedCropChip(key);
    if (key === "All") {
      setSearchTerm("");
    } else {
      setSearchTerm(key);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDistrictFilter("");
    setSelectedCropChip("All");
  };

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

  const activeMatchesCount = myMatches?.length || 0;
  const availableHarvestsCount = rawListings?.length || 0;
  const sourcingHubName = buyerProfile?.base_district || t.common.rwanda;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- Page Header & Actions --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.buyerDashboard.title}</h1>
          <p className="text-slate-500 font-medium mt-1">
            {t.buyerDashboard.subtitle}
          </p>
        </div>

        {/* Action Button: Post Purchase Demand */}
        <Link
          href="/dashboard/buyer/requests"
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition text-xs font-bold whitespace-nowrap self-start md:self-auto"
        >
          <ClipboardList size={16} />
          <span>{t.buyerDashboard.postDemandCta}</span>
        </Link>
      </div>

      {/* --- Buyer Sourcing KPI Summary Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between group hover:border-green-300 transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.buyerDashboard.statsActiveMatches}</p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{activeMatchesCount}</h2>
            <p className="text-[10px] text-green-700 font-bold mt-1">{t.buyerDashboard.statsActiveMatchesDesc}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-700 rounded-2xl group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.buyerDashboard.statsTotalListed}</p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{availableHarvestsCount}</h2>
            <p className="text-[10px] text-blue-700 font-bold mt-1">{t.buyerDashboard.statsTotalListedDesc}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:scale-110 transition-transform">
            <Store size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-between group hover:border-amber-300 transition-all">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.buyerDashboard.statsSourcingHub}</p>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{sourcingHubName}</h2>
            <p className="text-[10px] text-amber-700 font-bold mt-1">{t.buyerDashboard.statsSourcingHubDesc}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl group-hover:scale-110 transition-transform">
            <MapPin size={24} />
          </div>
        </div>
      </div>

      {/* --- Search, District Filter & Quick Crop Chips --- */}
      <div className="card p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t.buyerDashboard.searchPlaceholder}
              className="input-field pl-10 h-11 text-sm w-full bg-slate-50 border-slate-200 rounded-2xl focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-60">
            <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <select
              className="input-field pl-10 h-11 text-xs w-full bg-slate-50 border-slate-200 rounded-2xl focus:bg-white font-semibold"
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

        {/* Quick Crop Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
            {t.common.status}:
          </span>
          {cropChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleChipClick(chip.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                selectedCropChip === chip.key
                  ? "bg-green-700 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              {chip.label}
            </button>
          ))}

          {(searchTerm || districtFilter || selectedCropChip !== "All") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline px-2 py-1"
            >
              <RotateCcw size={12} /> {t.buyerDashboard.resetFilters}
            </button>
          )}
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
            {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-3xl" />)}
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
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-3xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="card p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Package className="mx-auto text-slate-300" size={40} />
            <h3 className="font-bold text-slate-800 text-base">{t.buyerDashboard.emptyMarketplaceTitle}</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
              {t.buyerDashboard.emptyMarketplaceDesc}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                {t.buyerDashboard.resetFilters}
              </button>
              <Link
                href="/dashboard/buyer/requests"
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-sm"
              >
                {t.buyerDashboard.postDemandCta} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing: Listing) => {
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
