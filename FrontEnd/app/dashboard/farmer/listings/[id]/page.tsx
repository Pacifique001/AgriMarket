"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { listingsService, Listing as ServiceListing } from "@/services/listings";
import { ArrowLeft, Trash2, Save, Loader2 } from "lucide-react";

type Listing = ServiceListing;

export default function ManageListingPage() {
    const { id } = useParams();
    const router = useRouter();

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        quantity_kg: "",
        asking_price: "",
        harvest_date: "",
        status: "available" as "available" | "matched" | "sold",
    });

    // -----------------------------
    // FETCH LISTING
    // -----------------------------
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
                alert("Failed to load listing");
            } finally {
                setLoading(false);
            }
        }

        fetchListing();
    }, [id]);

    // -----------------------------
    // UPDATE LISTING
    // -----------------------------
    async function handleUpdate() {
        setSaving(true);
        try {
            await listingsService.updateListing(id as string, {
                quantity_kg: Number(form.quantity_kg),
                asking_price: Number(form.asking_price),
                harvest_date: form.harvest_date ? form.harvest_date : undefined,
                status: (form.status as "available" | "matched" | "sold") ?? "available",
            });

            alert("Listing updated successfully");
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Update failed");
        } finally {
            setSaving(false);
        }
    }

    // -----------------------------
    // DELETE LISTING
    // -----------------------------
    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this listing?")) return;

        try {
            await listingsService.deleteListing(id as string);
            alert("Listing deleted");
            router.push("/dashboard/farmer");
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!listing) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* HEADER */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()}>
                    <ArrowLeft />
                </button>
                <h1 className="text-2xl font-black">
                    Manage Listing – {listing.crop_type}
                </h1>
            </div>

            {/* IMAGE */}
            {listing.image_url && (
                <img
                    src={listing.image_url}
                    className="rounded-xl w-full h-56 object-cover"
                    alt="crop"
                />
            )}

            {/* SUMMARY */}
            <div className="card p-5 space-y-2">
                <p><b>District:</b> {listing.district}</p>
                <p><b>Status:</b> {listing.status}</p>
                <p className="text-xs text-slate-500">
                    Created on {new Date(listing.created_at).toLocaleDateString()}
                </p>
            </div>

            {/* AI INSIGHT */}
            {listing.ai_suggested_price && (
                <div className="card p-5 bg-green-50 border-green-200">
                    <p className="font-bold text-green-700">
                        AI Suggested Price: {listing.ai_suggested_price} RWF/kg
                    </p>
                    <p className="text-sm text-green-600">
                        {listing.ai_market_message}
                    </p>
                </div>
            )}

            {/* EDIT FORM */}
            <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg">Update Listing</h2>

                <div>
                    <label className="label">Quantity (KG)</label>
                    <input
                        type="number"
                        className="input"
                        value={form.quantity_kg}
                        onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
                    />
                </div>

                <div>
                    <label className="label">Price (RWF / kg)</label>
                    <input
                        type="number"
                        className="input"
                        value={form.asking_price}
                        onChange={(e) => setForm({ ...form, asking_price: e.target.value })}
                    />
                </div>

                <div>
                    <label className="label">Harvest Date</label>
                    <input
                        type="date"
                        className="input"
                        value={form.harvest_date}
                        onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
                    />
                </div>

                <div>
                    <label className="label">Status</label>
                    <select
                        className="input"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as "available" | "matched" | "sold" })}
                    >
                        <option value="available">Available</option>
                        <option value="matched">Matched</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save Changes
                </button>
            </div>

            {/* DANGER ZONE */}
            <div className="card p-5 border-red-200 bg-red-50">
                <h3 className="font-bold text-red-700 mb-2">Danger Zone</h3>
                <button
                    onClick={handleDelete}
                    className="btn-danger flex items-center gap-2"
                >
                    <Trash2 size={16} /> Delete Listing
                </button>
            </div>
        </div>
    );
}
