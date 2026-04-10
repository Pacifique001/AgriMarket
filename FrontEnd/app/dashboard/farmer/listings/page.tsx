"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Loader2,
  X,
  BrainCircuit,
  ArrowRight,
  AlertCircle,
  PackageSearch,
} from "lucide-react";
import toast from "react-hot-toast";

import { listingsService } from "@/services/listings";
import { useUser, FarmerProfile } from "@/hooks/useUser";
import { useMarketAI } from "@/hooks/useMarketAI";
import { CropCard } from "@/components/CropCard";

/* ------------------ */
/* Crop Options       */
/* ------------------ */
const CROP_OPTIONS = [
  { id: 1, name: "Maize" },
  { id: 2, name: "Beans" },
  { id: 3, name: "Potato" },
  { id: 4, name: "Rice" },
];

/* ------------------ */
/* Validation Schema  */
/* ------------------ */
const listingSchema = z.object({
  crop_type: z.string().min(2),
  crop_id: z.number().min(1),
  quantity_kg: z.number().min(1),
  district: z.string().min(2),
  asking_price: z.number().min(1),
  image_url: z.string().url().optional().or(z.literal("")),
});

type ListingFormValues = z.infer<typeof listingSchema> & {
  sector?: string;
  harvest_date?: string;
};

export default function MyHarvestsPage() {
  const queryClient = useQueryClient();
  const { profile, isFarmer, isLoading: userLoading } = useUser();
  const { usePriceSuggestion } = useMarketAI();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;

  /* ------------------ */
  /* Queries            */
  /* ------------------ */
  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: listingsService.getMyListings,
    enabled: isFarmer,
  });

  /* ------------------ */
  /* Form               */
  /* ------------------ */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      crop_id: 0,
      image_url: "",
    },
  });

  useEffect(() => {
    if (farmerProfile?.district) {
      setValue("district", farmerProfile.district);
    }
  }, [farmerProfile, setValue]);

  const watchedCrop = watch("crop_type");
  const watchedDistrict = watch("district");

  /* ------------------ */
  /* Mutations          */
  /* ------------------ */
  const createMutation = useMutation({
    mutationFn: listingsService.createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Harvest published!");
      reset();
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create listing");
    },
  });

  /* ------------------ */
  /* AI Pricing         */
  /* ------------------ */
  const { data: priceSuggestion, isLoading: isAnalyzing } =
    usePriceSuggestion(watchedCrop, watchedDistrict);

  const applyAiPrice = () => {
    if (priceSuggestion?.suggested_price) {
      setValue("asking_price", priceSuggestion.suggested_price);
      toast.success("AI price applied");
    }
  };

  const filteredListings =
    listings?.filter((l: any) =>
      l.crop_type.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  /* ------------------ */
  /* Guards             */
  /* ------------------ */
  if (!userLoading && !isFarmer) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold mt-4">Farmer Access Required</h2>
        <p className="text-slate-500 mt-2">
          You must be logged in as a farmer.
        </p>
      </div>
    );
  }

  /* ------------------ */
  /* UI                 */
  /* ------------------ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold">My Harvests</h1>
          <p className="text-slate-500">
            Manage harvests & optimize pricing with AI
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={18} /> List Harvest
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-3 flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input
          className="flex-1 outline-none"
          placeholder="Search harvests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-green-600" size={48} />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <PackageSearch size={60} className="mx-auto text-slate-300" />
          <p className="mt-4 text-slate-500">No harvests yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredListings.map((listing: any) => (
            <CropCard key={listing.id} {...listing} role="farmer" />
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <div className="p-6 space-y-5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="text-green-600" /> New Listing
              </h2>

              <form
                onSubmit={handleSubmit((data) =>
                  createMutation.mutate(data)
                )}
                className="space-y-5"
              >
                {/* Crop & District */}
                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    {...register("crop_type")}
                    className="input-field"
                    onChange={(e) => {
                      const crop = CROP_OPTIONS.find(
                        (c) => c.name === e.target.value
                      );
                      crop && setValue("crop_id", crop.id);
                    }}
                  >
                    <option value="">Select Crop</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    {...register("district")}
                    placeholder="District"
                    className="input-field"
                  />
                </div>

                {/* Quantity & Price */}
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    {...register("quantity_kg", { valueAsNumber: true })}
                    placeholder="Quantity (kg)"
                    className="input-field"
                  />
                  <input
                    type="number"
                    {...register("asking_price", { valueAsNumber: true })}
                    placeholder="Price (RWF/kg)"
                    className="input-field"
                  />
                </div>

                {/* AI Button */}
                <button
                  type="button"
                  onClick={applyAiPrice}
                  disabled={!watchedCrop || !watchedDistrict || isAnalyzing}
                  className="w-full border border-green-500 text-green-700 rounded-lg py-2 hover:bg-green-50 flex justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Get AI Price Suggestion"
                  )}
                </button>

                {/* Submit */}
                <div className="sticky bottom-0 bg-white pt-4 border-t flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border rounded-lg py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 btn-primary"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Publish <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
