import api from "./api";

export interface ProfileUpdatePayload {
  // Farmer fields
  district?: string;
  sector?: string;
  village?: string;
  farm_size_hectares?: number;
  main_crops?: string;
  latitude?: number;
  longitude?: number;

  // Buyer fields
  company_name?: string;
  buyer_type?: string;
  base_district?: string;
  preferred_districts?: string;
  min_purchase_qty_kg?: number;
  max_purchase_qty_kg?: number;
}

export const profileService = {
  /**
   * Update farmer profile
   */
  async updateFarmerProfile(data: Partial<ProfileUpdatePayload>) {
    const res = await api.patch("/farmers/me", data);
    return res.data;
  },

  /**
   * Update buyer profile
   */
  async updateBuyerProfile(data: Partial<ProfileUpdatePayload>) {
    const res = await api.patch("/buyers/me", data);
    return res.data;
  },
};
