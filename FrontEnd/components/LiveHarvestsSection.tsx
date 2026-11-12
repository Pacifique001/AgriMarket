"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  Sprout, 
  MapPin, 
  Scale, 
  BrainCircuit, 
  ShoppingCart, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  X, 
  LogIn, 
  UserPlus, 
  Sparkles
} from "lucide-react";
import { listingsService, Listing } from "@/services/listings";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { getCropImageUrl } from "@/lib/crop-images";
import { cn } from "@/lib/utils";

export function LiveHarvestsSection() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("All");
  const [activeModalListing, setActiveModalListing] = useState<Listing | null>(null);

  // Fetch live published listings from API
  const { data: rawListings, isLoading } = useQuery({
    queryKey: ["homepage-public-listings"],
    queryFn: () => listingsService.getAllListings(),
  });

  const listings = rawListings || [];

  // Filter listings
  const filteredListings = listings.filter((l) => {
    if (selectedCropFilter === "All") return true;
    return l.crop_type.toLowerCase().includes(selectedCropFilter.toLowerCase());
  });

  const filterTabs = [
    { key: "All", label: t.liveHarvests.filterAll },
    { key: "Maize", label: t.liveHarvests.filterMaize },
    { key: "Beans", label: t.liveHarvests.filterBeans },
    { key: "Potato", label: t.liveHarvests.filterPotato },
    { key: "Rice", label: t.liveHarvests.filterRice },
    { key: "Cassava", label: t.liveHarvests.filterCassava },
  ];

  const handleHarvestClick = (listing: Listing) => {
    if (isAuthenticated && user?.role === "buyer") {
      // Buyer already logged in: jump straight to marketplace with this crop pre-searched
      router.push(`/dashboard/buyer/dashboard?search=${encodeURIComponent(listing.crop_type)}`);
    } else {
      // Not logged in or farmer: open modal prompt to sign in or register as buyer
      setActiveModalListing(listing);
    }
  };

  return (
    <section className="py-20 px-4 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-green-700" />
              <span>{t.liveHarvests.badge}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t.liveHarvests.titlePrefix}
              <span className="text-green-700">{t.liveHarvests.titleHighlight}</span>
            </h2>
            <p className="text-slate-600 max-w-2xl text-sm md:text-base font-medium">
              {t.liveHarvests.description}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedCropFilter(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                  selectedCropFilter === tab.key
                    ? "bg-green-700 text-white shadow-md shadow-green-700/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="animate-spin text-green-700" size={36} />
            <p className="text-sm text-slate-500 font-medium">{t.common.loading}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="card p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto">
              <Sprout size={32} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">{t.liveHarvests.emptyTitle}</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {t.liveHarvests.emptyDesc}
            </p>
            <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl">
              {t.liveHarvests.listHarvestCta} <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.slice(0, 8).map((listing) => {
              const imageUrl = getCropImageUrl(listing.crop_type, listing.image_url);
              return (
                <div
                  key={listing.id}
                  className="card group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => handleHarvestClick(listing)}
                >
                  {/* Crop Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={imageUrl}
                      alt={listing.crop_type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-green-800 shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                      {t.liveHarvests.availableBadge}
                    </div>
                    {listing.ai_suggested_price && (
                      <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-yellow-300 shadow-sm flex items-center gap-1">
                        <BrainCircuit size={12} />
                        {t.liveHarvests.aiVerifiedBadge}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-green-700 transition-colors">
                          {listing.crop_type}
                        </h3>
                        <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
                          {listing.asking_price.toLocaleString()} {t.common.rwfPerKg}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-slate-400" />
                          <span>{listing.quantity_kg.toLocaleString()} {t.common.kg} {t.liveHarvests.totalVolume}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{listing.district}{listing.sector ? `, ${listing.sector}` : ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <ShieldCheck size={14} className="text-green-600" />
                        <span>{t.liveHarvests.verifiedFarmer}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHarvestClick(listing);
                        }}
                        className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <ShoppingCart size={13} />
                        <span>{t.liveHarvests.interestedButton}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Marketplace CTA */}
        {listings.length > 8 && (
          <div className="text-center pt-4">
            <Link
              href={isAuthenticated && user?.role === "buyer" ? "/dashboard/buyer/dashboard" : "/auth/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-sm hover:border-green-600 hover:text-green-700 transition shadow-sm"
            >
              {t.liveHarvests.viewAllHarvests} ({listings.length}) <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* --- BUYER INTEREST / AUTH MODAL --- */}
      {activeModalListing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModalListing(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <ShoppingCart size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {t.liveHarvests.modalBadge}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {t.liveHarvests.modalTitlePrefix} {activeModalListing.crop_type}?
                </h3>
              </div>
            </div>

            {/* Harvest Summary Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">{t.liveHarvests.cropLabel}</span>
                <span className="font-extrabold text-slate-900">{activeModalListing.crop_type}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">{t.liveHarvests.quantityLabel}</span>
                <span className="font-extrabold text-slate-900">{activeModalListing.quantity_kg.toLocaleString()} {t.common.kg}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">{t.liveHarvests.priceLabel}</span>
                <span className="font-extrabold text-green-700">{activeModalListing.asking_price.toLocaleString()} {t.common.rwfPerKg}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">{t.liveHarvests.locationLabel}</span>
                <span className="font-extrabold text-slate-900">{activeModalListing.district}{activeModalListing.sector ? `, ${activeModalListing.sector}` : ""}</span>
              </div>
              {activeModalListing.harvest_date && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">{t.liveHarvests.harvestDateLabel}</span>
                  <span className="font-extrabold text-emerald-700">
                    {new Date(activeModalListing.harvest_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {t.liveHarvests.modalExplanation}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                href="/auth/login"
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 rounded-2xl font-bold shadow-lg"
              >
                <LogIn size={18} />
                <span>{t.liveHarvests.signInToBuy}</span>
              </Link>

              <Link
                href="/auth/register?role=buyer"
                className="w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                <UserPlus size={18} />
                <span>{t.liveHarvests.createBuyerAccount}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
