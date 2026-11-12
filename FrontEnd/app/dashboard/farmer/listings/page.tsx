"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Camera,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { listingsService } from "@/services/listings";
import { useUser, FarmerProfile } from "@/hooks/useUser";
import { useMarketAI } from "@/hooks/useMarketAI";
import { useLanguage } from "@/context/LanguageContext";
import { CropCard } from "@/components/CropCard";
import { RWANDA_DISTRICTS, CROP_OPTIONS } from "@/lib/constants";
import { getCropImageUrl } from "@/lib/crop-images";
import { cn } from "@/lib/utils";

/* Validation Schema requiring harvest photo, location, and date */
const listingSchema = z.object({
  crop_type: z.string().min(2, "Please select a crop"),
  crop_id: z.number().min(1, "Please select a crop"),
  quantity_kg: z.number().min(1, "Quantity must be at least 1 kg"),
  district: z.string().min(2, "Please select a district"),
  sector: z.string().min(2, "Please enter sector or farm location"),
  harvest_date: z.string().min(4, "Please select harvest or availability date"),
  asking_price: z.number().min(1, "Asking price must be at least 1 RWF"),
  image_url: z.string().min(5, "Harvest photo is required so buyers can inspect quality"),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export default function MyHarvestsPage() {
  const queryClient = useQueryClient();
  const { profile, isFarmer, isLoading: userLoading } = useUser();
  const { usePriceSuggestion } = useMarketAI();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) setSearchTerm(q);
    }
  }, []);

  const farmerProfile = isFarmer ? (profile as FarmerProfile) : null;

  /* Queries */
  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: listingsService.getMyListings,
    enabled: isFarmer,
  });

  /* Form */
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
      crop_type: "",
      district: "",
      sector: "",
      harvest_date: new Date().toISOString().split("T")[0],
      quantity_kg: undefined as any,
      asking_price: undefined as any,
      image_url: "",
    },
  });

  useEffect(() => {
    if (farmerProfile?.district) {
      setValue("district", farmerProfile.district);
    }
    if (farmerProfile?.sector) {
      setValue("sector", farmerProfile.sector);
    }
  }, [farmerProfile, setValue]);

  const watchedCrop = watch("crop_type");
  const watchedDistrict = watch("district");
  const watchedImageUrl = watch("image_url");

  /* Handle file upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const localPreviewUrl = URL.createObjectURL(file);
      setImagePreview(localPreviewUrl);

      const serverUrl = await listingsService.uploadImage(file);
      setValue("image_url", serverUrl, { shouldValidate: true });
      toast.success(t.farmerListings.photoAttached);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Upload failed. You can use verified crop photo.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  /* Use verified authentic preset crop photo */
  const handleUsePresetPhoto = () => {
    if (!watchedCrop) {
      toast.error(t.farmerListings.selectCrop);
      return;
    }
    const preset = getCropImageUrl(watchedCrop);
    setValue("image_url", preset, { shouldValidate: true });
    setImagePreview(preset);
    toast.success(`${t.farmerListings.photoAttached}: ${watchedCrop}`);
  };

  /* Mutations */
  const createMutation = useMutation({
    mutationFn: listingsService.createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-public-listings"] });
      toast.success(t.farmerListings.successPublished);
      reset();
      setImagePreview("");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create listing");
    },
  });

  /* AI Pricing */
  const { data: priceSuggestion, isLoading: isAnalyzing } =
    usePriceSuggestion(watchedCrop, watchedDistrict);

  const applyAiPrice = () => {
    if (priceSuggestion?.suggested_price) {
      setValue("asking_price", priceSuggestion.suggested_price, { shouldValidate: true });
      toast.success("AI price applied");
    }
  };

  const filteredListings =
    listings?.filter((l: any) =>
      l.crop_type.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  /* Guards */
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

  /* UI */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t.farmerListings.title}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t.farmerListings.subtitle}
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setImagePreview("");
          }}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl shadow-md whitespace-nowrap active:scale-95 transition"
        >
          <Plus size={18} /> {t.farmerListings.listHarvestButton}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-slate-400 ml-1" />
        <input
          className="flex-1 outline-none text-sm text-slate-800 placeholder:text-slate-400"
          placeholder={t.farmerListings.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-green-600" size={42} />
          <p className="text-sm text-slate-500 font-medium">{t.common.loading}</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3 p-8">
          <PackageSearch size={56} className="mx-auto text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">{t.farmerListings.emptyListingsTitle}</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {t.farmerListings.emptyListingsDesc}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl mt-2 shadow-md active:scale-95 transition"
          >
            <Plus size={16} /> {t.farmerListings.publishFirst}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing: any) => (
            <CropCard key={listing.id} {...listing} role="farmer" />
          ))}
        </div>
      )}

      {/* --- LISTING MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto relative shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 md:p-8 space-y-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  AgroMarket Rwanda
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                  <BrainCircuit className="text-green-600" /> {t.farmerListings.modalTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t.farmerListings.modalSubtitle}
                </p>
              </div>

              <form
                onSubmit={handleSubmit((data: ListingFormValues) => createMutation.mutate(data))}
                className="space-y-4"
                noValidate
              >
                {/* 1. Crop Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{t.farmerListings.cropTypeLabel}</label>
                  <select
                    {...register("crop_type")}
                    className={cn(
                      "input-field text-sm",
                      errors.crop_type && "border-red-500"
                    )}
                    onChange={(e) => {
                      const crop = CROP_OPTIONS.find((c) => c.name === e.target.value);
                      if (crop) {
                        setValue("crop_id", crop.id, { shouldValidate: true });
                        setValue("crop_type", crop.name, { shouldValidate: true });
                      }
                    }}
                  >
                    <option value="">{t.farmerListings.selectCrop}</option>
                    {CROP_OPTIONS.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.crop_type && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.crop_type.message}</p>
                  )}
                </div>

                {/* 2. Location (District & Sector / Farm) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t.farmerListings.districtLabel}</label>
                    <select
                      {...register("district")}
                      className={cn(
                        "input-field text-sm",
                        errors.district && "border-red-500"
                      )}
                    >
                      <option value="">{t.farmerListings.selectDistrict}</option>
                      {RWANDA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.district.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t.farmerListings.sectorLabel}</label>
                    <input
                      type="text"
                      {...register("sector")}
                      placeholder={t.farmerListings.sectorPlaceholder}
                      className={cn(
                        "input-field text-sm",
                        errors.sector && "border-red-500"
                      )}
                    />
                    {errors.sector && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.sector.message}</p>
                    )}
                  </div>
                </div>

                {/* 3. When to be Harvested (Availability Date) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-green-600" />
                    <span>{t.farmerListings.harvestDateLabel}</span>
                  </label>
                  <input
                    type="date"
                    {...register("harvest_date")}
                    className={cn(
                      "input-field text-sm",
                      errors.harvest_date && "border-red-500"
                    )}
                  />
                  {errors.harvest_date && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.harvest_date.message}</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {t.farmerListings.harvestDateHelper}
                  </p>
                </div>

                {/* 4. Quantity & Asking Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t.farmerListings.quantityLabel}</label>
                    <input
                      type="number"
                      {...register("quantity_kg", { valueAsNumber: true })}
                      placeholder={t.farmerListings.quantityPlaceholder}
                      className={cn(
                        "input-field text-sm",
                        errors.quantity_kg && "border-red-500"
                      )}
                    />
                    {errors.quantity_kg && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.quantity_kg.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t.farmerListings.askingPriceLabel}</label>
                    <input
                      type="number"
                      {...register("asking_price", { valueAsNumber: true })}
                      placeholder={t.farmerListings.askingPricePlaceholder}
                      className={cn(
                        "input-field text-sm",
                        errors.asking_price && "border-red-500"
                      )}
                    />
                    {errors.asking_price && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.asking_price.message}</p>
                    )}
                  </div>
                </div>

                {/* AI Price Button */}
                <button
                  type="button"
                  onClick={applyAiPrice}
                  disabled={!watchedCrop || !watchedDistrict || isAnalyzing}
                  className="w-full border border-green-500 text-green-700 rounded-xl py-2.5 text-xs font-bold hover:bg-green-50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Sparkles size={14} /> {t.farmerListings.aiButton}
                    </>
                  )}
                </button>

                {/* 5. HARVEST IMAGE UPLOAD (REQUIRED) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera size={14} className="text-green-700" />
                      <span>{t.farmerListings.uploadPhotoLabel}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">JPG, PNG, WebP</span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Image Preview or Upload Actions */}
                  {imagePreview || watchedImageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
                      <img
                        src={imagePreview || watchedImageUrl}
                        alt="Harvest preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-green-700 text-xs font-bold">
                          <CheckCircle2 size={14} /> {t.farmerListings.photoAttached}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {watchedCrop ? `${watchedCrop} harvest` : "Produce photo"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                        >
                          {t.farmerListings.changePhoto}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("image_url", "", { shouldValidate: true });
                            setImagePreview("");
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition hover:border-green-500 hover:bg-green-50/50 flex flex-col items-center justify-center gap-2",
                          errors.image_url ? "border-red-400 bg-red-50/20" : "border-slate-300"
                        )}
                      >
                        {isUploadingImage ? (
                          <div className="flex items-center gap-2 text-green-700 text-xs font-bold py-2">
                            <Loader2 className="animate-spin" size={18} />
                            {t.farmerListings.uploadingPhoto}
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                              <Upload size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {t.farmerListings.uploadPrompt}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {t.farmerListings.uploadTip}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Fallback button: use verified authentic crop photo */}
                      <button
                        type="button"
                        onClick={handleUsePresetPhoto}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <ImageIcon size={14} className="text-green-700" />
                        <span>{t.farmerListings.useVerifiedPreset} {watchedCrop || "Crop"}</span>
                      </button>
                    </div>
                  )}

                  {errors.image_url && (
                    <p className="text-[11px] text-red-500 font-medium">{errors.image_url.message}</p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || isUploadingImage}
                    className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        {t.farmerListings.publishButton} <ArrowRight size={16} />
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
