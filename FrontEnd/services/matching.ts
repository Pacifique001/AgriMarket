import api from "./api";

export interface MatchDetail {
  id: number;
  listing_id: number;
  buyer_id: number;
  match_score: number;
  match_reason?: string;
  status: "pending" | "interested" | "accepted" | "rejected" | "completed" | "expired";
  is_notified_farmer: boolean;
  is_notified_buyer: boolean;
  created_at: string;
  updated_at?: string;
  other_party_name: string;
  other_party_district: string;
  other_party_phone?: string;
  explanation?: string;
  distance_km?: number;
  crop_type?: string;
  quantity_kg?: number;
  asking_price?: number;
}

export interface ExpressInterestPayload {
  listing_id: number;
  offered_price?: number;
  offered_quantity?: number;
  message?: string;
  proposed_location?: string;
}

/**
 * MatchingService
 * Handles AI-generated connections, status updates, and direct buyer interests.
 */
export const matchingService = {
  /**
   * FARMER: Gets all buyers matched to a specific listing.
   */
  async getMatchesForListing(listingId: number | string): Promise<MatchDetail[]> {
    const response = await api.get(`/matches/listing/${listingId}`);
    return response.data;
  },

  /**
   * BUYER: Gets personalized AI harvest suggestions.
   */
  async getBuyerSuggestions(): Promise<MatchDetail[]> {
    const response = await api.get("/matches/buyer/suggestions");
    return response.data;
  },

  /**
   * BUYER: Gets all matches / interests already created by the buyer.
   */
  async getMyBuyerMatches(): Promise<MatchDetail[]> {
    const response = await api.get("/matches/buyer/my-matches");
    return response.data;
  },

  /**
   * BUYER: Express interest in ANY listing (marketplace or suggestion)
   * Triggers real SMS to farmer and creates/updates match record.
   */
  async expressInterest(payload: ExpressInterestPayload): Promise<MatchDetail> {
    const response = await api.post("/matches/interest", payload);
    return response.data;
  },

  /**
   * Updates the status of a match (interested, accepted, rejected).
   */
  async updateMatchStatus(matchId: number, status: string): Promise<MatchDetail> {
    const response = await api.patch(`/matches/${matchId}/status`, { status });
    return response.data;
  }
};
