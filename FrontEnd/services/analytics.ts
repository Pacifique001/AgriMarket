import api from "./api";

/**
 * AnalyticsService
 * Fetches high-level insights for Farmer, Buyer, and Admin dashboards.
 */
export const analyticsService = {
    // --- AI MARKET PREDICTION (PUBLIC) ---
    async getMarketPrediction(cropId: number, regionId: number, month?: number) {
      const params: any = { crop_id: cropId, region_id: regionId };
      if (month) params.month = month;
      const response = await api.get("/analytics/predict/market", { params });
      return response.data;
    },

    // --- AI MARKET INSIGHT (ADMIN/INTERNAL) ---
    async getAIMarketInsight(cropId: number, regionId: number, token: string) {
      const response = await api.get("/analytics/ai-market-insight", {
        params: { crop_id: cropId, region_id: regionId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  // --- FARMER ANALYTICS ---
  async getFarmerStats() {
    const response = await api.get("/farmers/stats");
    return response.data;
  },

  async getNearbyBuyers() {
    const response = await api.get("/farmers/nearby-buyers-count");
    return response.data;
  },

  // --- ADMIN/GLOBAL ANALYTICS ---
  async getSystemOverview() {
    const response = await api.get("/analytics/overview");
    return response.data;
  },

  async getPriceTrends(cropType: string) {
    const response = await api.get(`/analytics/price-trends/${cropType}`);
    return response.data;
  },

  async getMarketGaps() {
    const response = await api.get("/analytics/market-gaps");
    return response.data;
  }
  ,
  // --- ADMIN REGIONAL ACTIVITY ---
  async getRegionalActivity() {
    const response = await api.get("/analytics/regional-activity");
    return response.data;
  }
};