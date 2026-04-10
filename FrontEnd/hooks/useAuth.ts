"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

// Define the shape of the JWT payload from our FastAPI backend
interface UserPayload {
  sub: string;      // User ID (mapped from FastAPI)
  role: "farmer" | "buyer" | "admin";
  phone: string;
  full_name?: string; // Optional: depends if included in JWT
  exp: number;      // Expiration timestamp
}

interface AuthState {
  token: string | null;
  user: UserPayload | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // Vital for Next.js Hydration safety
  setAuth: (token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

/**
 * useAuth Hook
 * Manages global authentication state, persists to LocalStorage,
 * and handles JWT decoding/validation.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (token: string) => {
        try {
          // 1. Decode the JWT
          const decoded = jwtDecode<UserPayload>(token);
          
          // 2. Validate Expiration
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            console.error("Token is already expired");
            get().logout();
            return;
          }

          // 3. Update Global State
          set({
            token,
            user: decoded,
            isAuthenticated: true,
          });
          
          // 4. Sync with LocalStorage for API interceptors
          localStorage.setItem("token", token);
        } catch (error) {
          console.error("Auth Error: Failed to decode or set token", error);
          get().logout();
        }
      },

      logout: () => {
        // Clear everything
        localStorage.removeItem("token");
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        });
        
        // Hard redirect to clear any sensitive data in memory
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "agro-market-auth", // Unique name for LocalStorage key
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // This runs after the store has successfully loaded from LocalStorage
        if (state) {
          state.setHasHydrated(true);
          
          // Automated logout if the stored token is expired on load
          if (state.token) {
            try {
              const decoded = jwtDecode<UserPayload>(state.token);
              if (decoded.exp < Date.now() / 1000) {
                state.logout();
              }
            } catch {
              state.logout();
            }
          }
        }
      },
    }
  )
);