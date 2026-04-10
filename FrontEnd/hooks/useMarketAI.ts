"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { analyticsService } from "@/services/analytics";

// --- Types for AI Responses ---

export interface AIPriceAnalysis {
  suggested_price: number;
  market_confidence: number;
  price_trend: "Increasing" | "Decreasing" | "Stable";
  reasoning: string;
}

export interface PriceTrendPoint {
  date: string;
  avg: number;
  min: number;
  max: number;
}

export interface MarketGap {
  crop: string;
  unsatisfied_buyer_interest: number;
  district?: string;
  urgency: "High" | "Medium" | "Low";
}

/**
 * useMarketAI Hook
 * Centralizes all AI-driven market intelligence hooks.
 */
export function useMarketAI() {

  /**
   * 1. Dynamic Price Prediction
   */
  const usePriceSuggestion = (cropType?: string, district?: string) => {
    return useQuery<AIPriceAnalysis | null>({
      queryKey: ["price-suggestion", cropType, district],
      queryFn: async () => {
        if (!cropType || !district) return null;

        const res = await api.post("/listings/", {
          crop_type: cropType,
          district: district,
          quantity_kg: 1,
          asking_price: 1,
        });

        return {
          suggested_price: res.data.ai_suggested_price,
          market_confidence: 0.85,
          price_trend: "Stable",
          reasoning: `AI analysis based on historical trends in ${district}.`,
        };
      },
      enabled: !!cropType && !!district,
      staleTime: 1000 * 60 * 10,
    });
  };

  /**
   * 2. Crop Price Trends (Charts)
   */
  const useCropTrends = (cropType?: string) => {
    return useQuery<PriceTrendPoint[]>({
      queryKey: ["crop-trends", cropType],
      queryFn: async () => {
        const res = await api.get(`/analytics/price-trends/${cropType}`);
        return res.data;
      },
      enabled: !!cropType,
      staleTime: 1000 * 60 * 60,
    });
  };

  /**
   * 3. Market Gaps (Planting Advice)
   */
  const useMarketGaps = () => {
    return useQuery<MarketGap[]>({
      queryKey: ["market-gaps"],
      queryFn: async () => {
        const res = await api.get("/analytics/market-gaps");
        return res.data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };

  /**
   * 4. Public AI Market Prediction
   */
  const useMarketPrediction = (
    cropId?: number,
    regionId?: number,
    month?: number
  ) => {
    return useQuery({
      queryKey: ["market-prediction", cropId, regionId, month],
      queryFn: async () => {
        if (cropId == null || regionId == null) return null;
        return analyticsService.getMarketPrediction(cropId, regionId, month);
      },
      enabled: cropId != null && regionId != null,
      staleTime: 1000 * 60 * 5,
    });
  };

  return {
    usePriceSuggestion,
    useCropTrends,
    useMarketGaps,
    useMarketPrediction,
  };
}
