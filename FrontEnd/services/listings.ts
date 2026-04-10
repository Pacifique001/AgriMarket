import api from "./api";

/* -------------------------------------------------
   Backend-aligned Listing type (ListingRead)
-------------------------------------------------- */
export interface Listing {
  id: number;
  crop_type: string;
  crop_id: number;

  quantity_kg: number;
  asking_price: number;

  district: string;
  sector?: string | null;
  harvest_date?: string | null;

  image_url?: string | null;

  ai_suggested_price?: number | null;
  ai_price_status?: string | null;
  ai_confidence?: number | null;
  ai_price_direction?: string | null;
  ai_market_message?: string | null;

  status: "available" | "matched" | "sold";

  farmer_id: number;
  created_at: string;
  updated_at?: string | null;
}

/* -------------------------------------------------
   Helper: normalize numeric safety
-------------------------------------------------- */
const normalizeListing = (l: any): Listing => ({
  ...l,
  quantity_kg: Number(l.quantity_kg ?? 0),
  asking_price: Number(l.asking_price ?? 0),
  ai_suggested_price:
    l.ai_suggested_price !== null && l.ai_suggested_price !== undefined
      ? Number(l.ai_suggested_price)
      : null,
});

/* -------------------------------------------------
   ListingsService
-------------------------------------------------- */
export const listingsService = {
  /**
   * Fetch all public listings (Buyer side)
   */
  async getAllListings(filters: {
    crop_type?: string;
    district?: string;
  } = {}): Promise<Listing[]> {
    const params = new URLSearchParams();

    if (filters.crop_type) params.append("crop_type", filters.crop_type);
    if (filters.district) params.append("district", filters.district);

    const res = await api.get(`/listings/?${params.toString()}`);
    return res.data.map(normalizeListing);
  },

  /**
   * Create a new listing (Farmer)
   * Triggers AI pricing on backend
   */
  async createListing(data: {
    crop_type: string;
    crop_id: number;
    quantity_kg: number;
    district: string;
    sector?: string;
    harvest_date?: string;
    asking_price: number;
    image_url?: string | null;
  }): Promise<Listing> {
    const res = await api.post("/listings/", data);
    return normalizeListing(res.data);
  },

  /**
   * Get listings for logged-in farmer
   */                                        
  async getMyListings(): Promise<Listing[]> {
    const res = await api.get("/listings/my-listings");
    return res.data.map(normalizeListing);
  },

  /**
   * Get single listing details
   */
  async getListingById(id: number | string): Promise<Listing> {
    const res = await api.get(`/listings/${id}`);
    return normalizeListing(res.data);
  },

  /**
   * Update listing (price, quantity, status, etc.)
   */
  async updateListing(
    id: number | string,
    data: Partial<{
      quantity_kg: number;
      asking_price: number;
      status: "available" | "matched" | "sold";
      harvest_date?: string;
    }>
  ): Promise<Listing> {
    const res = await api.patch(`/listings/${id}`, data);
    return normalizeListing(res.data);
  },

  /**
   * Delete listing permanently
   */
  async deleteListing(id: number | string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },
};
