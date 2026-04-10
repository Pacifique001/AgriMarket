"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "./useAuth";

// --- Types for Profile Data ---

export interface FarmerProfile {
  id: number;
  full_name: string;
  phone: string;
  district: string;
  sector?: string;
  village?: string;
  farm_size_hectares?: number;
  main_crops?: string;
  latitude?: number;
  longitude?: number;
  joined_at: string;
}

export interface BuyerProfile {
  id: number;
  full_name: string;
  phone: string;
  company_name?: string;
  buyer_type: string;
  is_verified: boolean;
  base_district: string;
  preferred_districts?: string;
  min_qty?: number;
  max_qty?: number;
  joined_at: string;
}

/**
 * useUser Hook
 * Fetches the specific profile details for the currently authenticated user.
 * Automatically switches between /farmers/me and /buyers/me.
 */
export function useUser() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, _hasHydrated } = useAuth();

  const {
    data: profile,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<FarmerProfile | BuyerProfile | null>({
    // Unique key per user and role
    queryKey: ["user-profile", user?.sub, user?.role],
    
    queryFn: async () => {
      // 1. Guard: Don't fetch if not authenticated or not hydrated
      if (!isAuthenticated || !user?.role) return null;

      // 2. Determine Endpoint based on Role
      const endpoint = user.role === "farmer" ? "/farmers/me" : "/buyers/me";
      
      try {
        const res = await api.get(endpoint);
        return res.data;
      } catch (err: any) {
        // If profile isn't found (e.g., newly registered but profile row failed)
        if (err.response?.status === 404) {
          console.warn("Profile not found in database.");
          return null;
        }
        throw err;
      }
    },

    // 3. Configuration
    enabled: _hasHydrated && isAuthenticated && !!user?.role,
    staleTime: 1000 * 60 * 5, // Profile data is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30,    // Keep in cache for 30 minutes
    retry: 1,                 // Only retry once on failure
  });

  /**
   * Helper to manually invalidate the cache (useful after profile updates)
   */
  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["user-profile", user?.sub] });
  };

  return {
    // Data & Loading States
    profile,
    isLoading: isLoading || !_hasHydrated, // Include hydration check in loading state
    isFetching,
    error,
    
    // Actions
    refreshProfile: refetch,
    invalidateProfile,

    // Role Helpers (Convenience for UI logic)
    role: user?.role,
    isFarmer: user?.role === "farmer",
    isBuyer: user?.role === "buyer",
    isAdmin: user?.role === "admin",
    userId: user?.sub,
  };
}