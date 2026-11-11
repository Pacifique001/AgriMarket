"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trash2,
  Save,
  Loader2,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  BrainCircuit,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

import { listingsService, Listing as ServiceListing } from "@/services/listings";
import { matchingService, MatchDetail } from "@/services/matching";
import { BargainModal } from "@/components/BargainModal";
import { cn } from "@/lib/utils";

type Listing = ServiceListing;

export default function ManageListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active chat/bargain modal
  const [activeBargainMatch, setActiveBargainMatch] = useState<MatchDetail | null>(null);

  const [form, setForm] = useState({
    quantity_kg: "",
    asking_price: "",
    harvest_date: "",
    status: "available" as "available" | "matched" | "sold",
  });

  // 1. Fetch Listing
  useEffect(() => {
    async function fetchListing() {
      try {
        const data = await listingsService.getListingById(id as string);
        setListing(data);
        setForm({
          quantity_kg: data.quantity_kg?.toString() || "",
          asking_price: data.asking_price?.toString() || "",
          harvest_date: data.harvest_date ? data.harvest_date.slice(0, 10) : "",
          status: data.status,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchListing();
  }, [id]);

  // 2. Fetch Matched / Interested Buyers
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["listing-matches", id],
    queryFn: () => matchingService.getMatchesForListing(id as string),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5s for live buyer alerts!
  });

  // 3. Update Match Status Mutation (Accept / Reject)
  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: number; status: string }) =>
      matchingService.updateMatchStatus(matchId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listing-matches", id] });
      if (variables.status === "accepted") {
        toast.success("Deal Accepted! Buyer has been alerted via SMS.");
      } else {
        toast.success("Match updated.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to update match status.");
    }
  });

  // 4. Update Listing
  async function handleUpdate() {
    setSaving(true);
    try {
      await listingsService.updateListing(id as string, {
        quantity_kg: Number(form.quantity_kg),
        asking_price: Number(form.asking_price),
        harvest_date: form.harvest_date ? form.harvest_date : undefined,
        status: (form.status as "available" | "matched" | "sold") ?? "available",
      });

      toast.success("Listing updated successfully");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  // 5. Delete Listing
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      await listingsService.deleteListing(id as string);
      toast.success("Listing deleted");
      router.push("/dashboard/farmer");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-green-700" size={32} />
      </div>
    );
  }

  if (!listing) return null;

  const interestedMatches = matches?.filter(m => m.status === "interested" || m.status === "accepted") || [];
  const otherMatches = matches?.filter(m => m.status !== "interested" && m.status !== "accepted") || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Manage Harvest – {listing.crop_type}
            </h1>
            <p className="text-xs text-slate-500">
              Listed on {new Date(listing.created_at).toLocaleDateString()} in {listing.district}
            </p>
          </div>
        </div>

        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
          listing.status === "available" && "bg-green-100 text-green-800",
          listing.status === "matched" && "bg-blue-100 text-blue-800",
          listing.status === "sold" && "bg-slate-100 text-slate-600"
        )}>
          {listing.status}
        </span>
      </div>

      {/* IMAGE */}
      {listing.image_url && (
        <img
          src={listing.image_url}
          className="rounded-2xl w-full h-64 object-cover shadow-sm border"
          alt="crop"
        />
      )}

      {/* AI INSIGHT BANNER */}
      {listing.ai_suggested_price && (
        <div className="card p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-green-700 text-white rounded-2xl">
            <BrainCircuit size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-green-900 text-sm">AI Market Recommendation</p>
              <span className="text-xs font-black text-green-700 bg-white px-2.5 py-0.5 rounded-full border border-green-200">
                AI Suggested: {listing.ai_suggested_price} RWF/kg
              </span>
            </div>
            <p className="text-xs text-green-800 leading-relaxed font-medium">
              {listing.ai_market_message || "Demand in this region is positive."}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🚨 CRITICAL NEW FEATURE: INTERESTED BUYERS & NEGOTIATION DEALS SECTION */}
      {/* ======================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-green-700" size={22} />
            <h2 className="text-xl font-bold text-slate-900">
              Buyer Matches & Negotiation Deals
            </h2>
          </div>
          {interestedMatches.length > 0 && (
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
              <Sparkles size={12} /> {interestedMatches.length} Interested Buyer(s)!
            </span>
          )}
        </div>

        {matchesLoading ? (
          <div className="card p-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-green-700" size={28} />
          </div>
        ) : matches?.length === 0 ? (
          <div className="card p-8 text-center border-dashed border-2 bg-slate-50 space-y-2">
            <Users className="mx-auto text-slate-300" size={32} />
            <p className="text-slate-600 font-bold text-sm">No buyers matched yet.</p>
            <p className="text-xs text-slate-400">
              As soon as nearby buyers search or express interest in {listing.crop_type}, they will appear here and you will receive an SMS alert!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show interested buyers first */}
            {matches?.map((match: MatchDetail) => {
              const isInterested = match.status === "interested";
              const isAccepted = match.status === "accepted";

              return (
                <div
                  key={match.id}
                  className={cn(
                    "card p-5 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                    isInterested && "border-amber-300 bg-amber-50/40 shadow-sm",
                    isAccepted && "border-green-300 bg-green-50/40 shadow-sm",
                    !isInterested && !isAccepted && "border-slate-200 bg-white"
                  )}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        {match.other_party_name}
                      </span>
                      {isInterested && (
                        <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          🚨 Expressed Interest
                        </span>
                      )}
                      {isAccepted && (
                        <span className="bg-green-700 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          ✓ Deal Accepted
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {Math.round(match.match_score * 100)}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" /> {match.other_party_district}
                      </span>
                      {match.other_party_phone && (
                        <a href={`tel:${match.other_party_phone}`} className="flex items-center gap-1 text-green-700 hover:underline">
                          <Phone size={13} /> {match.other_party_phone}
                        </a>
                      )}
                      <span className="text-slate-400">
                        Match Reason: {match.explanation || match.match_reason || "AI matched volume & location"}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this buyer */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Bargain / Chat button */}
                    <button
                      type="button"
                      onClick={() => setActiveBargainMatch(match)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <MessageSquare size={15} /> Bargain / Chat
                    </button>

                    {/* Accept button */}
                    {!isAccepted && (
                      <button
                        type="button"
                        onClick={() => updateMatchMutation.mutate({ matchId: match.id, status: "accepted" })}
                        disabled={updateMatchMutation.isPending}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-700 text-white hover:bg-green-800 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} /> Accept Deal
                      </button>
                    )}

                    {/* Reject button */}
                    {isInterested && (
                      <button
                        type="button"
                        onClick={() => updateMatchMutation.mutate({ matchId: match.id, status: "rejected" })}
                        disabled={updateMatchMutation.isPending}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Decline match"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT FORM */}
      <div className="card p-6 space-y-4 bg-white border border-slate-200">
        <h2 className="font-bold text-lg text-slate-900">Update Harvest Parameters</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Quantity Available (KG)</label>
            <input
              type="number"
              className="input-field"
              value={form.quantity_kg}
              onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Asking Price (RWF / kg)</label>
            <input
              type="number"
              className="input-field"
              value={form.asking_price}
              onChange={(e) => setForm({ ...form, asking_price: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Harvest Date</label>
            <input
              type="date"
              className="input-field"
              value={form.harvest_date}
              onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "available" | "matched" | "sold" })}
            >
              <option value="available">Available</option>
              <option value="matched">Matched</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Save Harvest Updates
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="card p-5 border-red-200 bg-red-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-red-900 text-sm">Delete Harvest Listing</h3>
          <p className="text-xs text-red-700">Once deleted, all matches and negotiations will be permanently removed.</p>
        </div>
        <button
          onClick={handleDelete}
          className="btn-danger flex items-center gap-2 text-xs py-2 px-4"
        >
          <Trash2 size={16} /> Delete Listing
        </button>
      </div>

      {/* --- Bargaining & Chat Modal for Farmer --- */}
      {activeBargainMatch && (
        <BargainModal
          isOpen={!!activeBargainMatch}
          onClose={() => setActiveBargainMatch(null)}
          matchId={activeBargainMatch.id}
          listingCrop={listing.crop_type}
          listingQuantity={listing.quantity_kg}
          listingAskingPrice={listing.asking_price}
          listingDistrict={listing.district}
          otherPartyName={activeBargainMatch.other_party_name}
          otherPartyPhone={activeBargainMatch.other_party_phone}
          otherPartyRole="Buyer"
          currentMatchStatus={activeBargainMatch.status}
          onAcceptDeal={() => {
            updateMatchMutation.mutate({ matchId: activeBargainMatch.id, status: "accepted" });
            setActiveBargainMatch(null);
          }}
        />
      )}
    </div>
  );
}
