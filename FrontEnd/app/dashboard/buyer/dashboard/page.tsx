"use client";

import { useState, useMemo } from "react";
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
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

// Modular Services & Hooks
import { matchingService, MatchDetail } from "@/services/matching";
import { listingsService, Listing } from "@/services/listings";
import { useUser, BuyerProfile } from "@/hooks/useUser";
import { CropCard } from "@/components/CropCard";
import { BargainModal } from "@/components/BargainModal";
import { cn } from "@/lib/utils";

export default function BuyerDashboard() {
  const queryClient = useQueryClient();
  const { profile, isBuyer, isLoading: userLoading } = useUser();

  const buyerProfile = isBuyer ? (profile as BuyerProfile) : null;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");

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

  // 3. Query: Fetch All Active Buyer Matches (to persist interest state & enable chat)
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
      toast.success("🚨 Farmer alerted via SMS! You can now negotiate price & place.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Could not process interest.");
    },
  });

  // 5. Mutation: Real Express Interest for General Marketplace Listings
  const [pendingListingId, setPendingListingId] = useState<number | null>(null);

  const listingInterestMutation = useMutation({
    mutationFn: async (listing: Listing) => {
      setPendingListingId(listing.id);
      return await matchingService.expressInterest({
        listing_id: listing.id
      });
    },
    onSuccess: (createdMatch, listing) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-buyer-matches"] });
      queryClient.invalidateQueries({ queryKey: ["buyer-suggestions"] });
      setPendingListingId(null);
      toast.success(`🚨 Farmer alerted via SMS for ${listing.crop_type}! Click Bargain to chat.`);
    },
    onError: (err: any) => {
      setPendingListingId(null);
      toast.error(err?.response?.data?.detail || "Could not express interest.");
    },
  });

  // Unauthorized view
  if (!userLoading && !isBuyer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Buyer Access Only</h2>
        <p className="text-slate-500">Please switch to a buyer account to view the marketplace.</p>
      </div>
    );
  }

  return (
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
            <option value="Huye">Huye</option>
            <option value="Rubavu">Rubavu</option>
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
        ) : suggestions && suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((match: MatchDetail) => (
              <SuggestionCard
                key={match.id}
                match={match}
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
function SuggestionCard({ match, onInterest, onChat, isPending }: {
  match: MatchDetail;
  onInterest: () => void;
  onChat: () => void;
  isPending: boolean;
}) {
  const isInterested = match.status === "interested" || match.status === "accepted";

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
            "{match.explanation || match.match_reason}"
          </p>
        </div>

        {isInterested ? (
          <div className="flex gap-2">
            <div className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 border border-green-200 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> Alerted
            </div>
            <button
              onClick={onChat}
              className="flex-1 py-2.5 rounded-xl bg-green-700 text-white hover:bg-green-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <MessageSquare size={16} /> Bargain
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
              <>Express Interest <ShoppingCart size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
