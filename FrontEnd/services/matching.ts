import api from "./api";

/**
 * MatchingService
 * Handles AI-generated connections and status updates.
 */
export const matchingService = {
  /**
   * FARMER: Gets all buyers matched to a specific listing.
   */
  async getMatchesForListing(listingId: number | string) {
    const response = await api.get(`/matches/listing/${listingId}`);
    return response.data;
  },

  /**
   * BUYER: Gets personalized AI harvest suggestions.
   */
  async getBuyerSuggestions() {
    const response = await api.get("/matches/buyer/suggestions");
    return response.data;
  },

  /**
   * Updates the status of a match (Interested, Accepted, Rejected).
   */
  async updateMatchStatus(matchId: number, status: string) {
    const response = await api.patch(`/matches/${matchId}/status`, { status });
    return response.data;
  }
};