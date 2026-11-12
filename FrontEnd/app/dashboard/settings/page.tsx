"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, FarmerProfile, BuyerProfile } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services/profile";
import { 
  User, 
  MapPin, 
  Building2, 
  Sprout, 
  Save, 
  Loader2, 
  Camera, 
  ShieldCheck, 
  Phone, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { RWANDA_DISTRICTS } from "@/lib/constants";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isFarmer, isBuyer, isLoading, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);

  // Profile photo state (saved locally in browser storage)
  const [photoUrl, setPhotoUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && user?.sub) {
      const stored = localStorage.getItem(`user_avatar_${user.sub}`);
      if (stored) {
        setPhotoUrl(stored);
      }
    }
  }, [user?.sub]);

  // Farmer form state
  const [farmerForm, setFarmerForm] = useState({
    district: "",
    sector: "",
    village: "",
    farm_size_hectares: "",
    main_crops: "",
  });

  // Buyer form state
  const [buyerForm, setBuyerForm] = useState({
    company_name: "",
    buyer_type: "individual",
    base_district: "",
    preferred_districts: "",
    min_purchase_qty_kg: "",
    max_purchase_qty_kg: "",
  });

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      if (isFarmer) {
        const fp = profile as FarmerProfile;
        setFarmerForm({
          district: fp.district || "",
          sector: fp.sector || "",
          village: fp.village || "",
          farm_size_hectares: fp.farm_size_hectares ? String(fp.farm_size_hectares) : "",
          main_crops: fp.main_crops || "",
        });
      } else if (isBuyer) {
        const bp = profile as BuyerProfile;
        setBuyerForm({
          company_name: bp.company_name || "",
          buyer_type: bp.buyer_type || "individual",
          base_district: bp.base_district || "",
          preferred_districts: bp.preferred_districts || "",
          min_purchase_qty_kg: bp.min_qty ? String(bp.min_qty) : "",
          max_purchase_qty_kg: bp.max_qty ? String(bp.max_qty) : "",
        });
      }
    }
  }, [profile, isFarmer, isBuyer]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoUrl(result);
      if (user?.sub) {
        localStorage.setItem(`user_avatar_${user.sub}`, result);
        window.dispatchEvent(new Event("avatar-updated"));
      }
      toast.success("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    if (user?.sub) {
      localStorage.removeItem(`user_avatar_${user.sub}`);
      window.dispatchEvent(new Event("avatar-updated"));
    }
    toast.success("Profile photo removed");
  };

  const handleBackToDashboard = () => {
    if (isFarmer) {
      router.push("/dashboard/farmer/dashboard");
    } else if (isBuyer) {
      router.push("/dashboard/buyer/dashboard");
    } else {
      router.push("/dashboard/admin/dashboard");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isFarmer) {
        await profileService.updateFarmerProfile({
          district: farmerForm.district,
          sector: farmerForm.sector || undefined,
          village: farmerForm.village || undefined,
          farm_size_hectares: farmerForm.farm_size_hectares ? Number(farmerForm.farm_size_hectares) : undefined,
          main_crops: farmerForm.main_crops || undefined,
        });
      } else if (isBuyer) {
        await profileService.updateBuyerProfile({
          company_name: buyerForm.company_name || undefined,
          buyer_type: buyerForm.buyer_type || undefined,
          base_district: buyerForm.base_district,
          preferred_districts: buyerForm.preferred_districts || undefined,
          min_purchase_qty_kg: buyerForm.min_purchase_qty_kg ? Number(buyerForm.min_purchase_qty_kg) : undefined,
          max_purchase_qty_kg: buyerForm.max_purchase_qty_kg ? Number(buyerForm.max_purchase_qty_kg) : undefined,
        });
      }
      await refreshProfile();
      toast.success("Profile settings saved successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save profile settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-green-700" size={36} />
      </div>
    );
  }

  const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User";
  const fullName = profile?.full_name || "AgroMarket Member";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* NAVIGATION & BREADCRUMB HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={handleBackToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all group active:scale-95"
        >
          <ArrowLeft size={16} className="text-slate-500 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="text-xs font-semibold text-slate-400">
          <span>AgroMarket</span> / <span className="text-green-700 font-bold">Settings</span>
        </div>
      </div>

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account & Settings</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Manage your personal identity, contact profile, and marketplace matching preferences.
        </p>
      </div>

      {/* PROFILE PHOTO & IDENTITY CARD */}
      <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white text-3xl font-black shadow-md border-2 border-white">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{fullName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <label 
            htmlFor="avatar-input" 
            className="absolute bottom-0 right-0 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
            title="Upload new photo"
          >
            <Camera size={16} />
            <input 
              id="avatar-input" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoUpload} 
            />
          </label>
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl font-black text-slate-900">{fullName}</h2>
            <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 font-black rounded-full uppercase tracking-wider">
              {roleName}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Phone size={13} className="text-slate-400" />
              {user?.phone || profile?.phone}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-600" />
              Verified AgroMarket Account
            </span>
          </div>

          {photoUrl && (
            <button
              onClick={handleRemovePhoto}
              className="text-xs text-red-600 hover:underline font-bold mt-2 inline-block"
            >
              Remove custom photo
            </button>
          )}
        </div>
      </div>

      {/* FORM SECTION */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* FARMER SETTINGS */}
        {isFarmer && (
          <div className="card p-6 md:p-8 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-green-50 text-green-700 rounded-xl">
                <Sprout size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Farm & Production Settings</h3>
                <p className="text-xs text-slate-500">Logistics and produce details used for AI matching.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Primary District *
                </label>
                <select
                  value={farmerForm.district}
                  onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select District</option>
                  {RWANDA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Sector / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kinigi / Muhoza"
                  value={farmerForm.sector}
                  onChange={(e) => setFarmerForm({ ...farmerForm, sector: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Village
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nyarugina"
                  value={farmerForm.village}
                  onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Farm Size (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={farmerForm.farm_size_hectares}
                  onChange={(e) => setFarmerForm({ ...farmerForm, farm_size_hectares: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Main Harvest Crops (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maize, Irish Potato, Beans, Rice"
                  value={farmerForm.main_crops}
                  onChange={(e) => setFarmerForm({ ...farmerForm, main_crops: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* BUYER SETTINGS */}
        {isBuyer && (
          <div className="card p-6 md:p-8 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Procurement & Buyer Settings</h3>
                <p className="text-xs text-slate-500">Configure your business details and purchase volumes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Company / Trading Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kigali Wholesale Mart"
                  value={buyerForm.company_name}
                  onChange={(e) => setBuyerForm({ ...buyerForm, company_name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Buyer Type
                </label>
                <select
                  value={buyerForm.buyer_type}
                  onChange={(e) => setBuyerForm({ ...buyerForm, buyer_type: e.target.value })}
                  className="input-field"
                >
                  <option value="individual">Individual Buyer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="retailer">Retailer / Supermarket</option>
                  <option value="hotel_restaurant">Hotel / Restaurant</option>
                  <option value="exporter">Exporter</option>
                  <option value="processor">Food Processor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Base District *
                </label>
                <select
                  value={buyerForm.base_district}
                  onChange={(e) => setBuyerForm({ ...buyerForm, base_district: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select District</option>
                  {RWANDA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Preferred Sourcing Districts (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Musanze, Kayonza, Nyabihu"
                  value={buyerForm.preferred_districts}
                  onChange={(e) => setBuyerForm({ ...buyerForm, preferred_districts: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Min Purchase Quantity (kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={buyerForm.min_purchase_qty_kg}
                  onChange={(e) => setBuyerForm({ ...buyerForm, min_purchase_qty_kg: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Max Purchase Quantity (kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={buyerForm.max_purchase_qty_kg}
                  onChange={(e) => setBuyerForm({ ...buyerForm, max_purchase_qty_kg: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl shadow-lg text-sm font-bold active:scale-95 transition"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Settings & Update Matching
        </button>
      </form>
    </div>
  );
}
