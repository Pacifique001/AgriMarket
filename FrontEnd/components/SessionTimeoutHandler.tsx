"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// 5 minutes of tab/user inactivity in milliseconds
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
// Warning notice 30 seconds before timeout (at 4.5 minutes)
const WARNING_TIMEOUT_MS = 4.5 * 60 * 1000;
const STORAGE_KEY = "agrimarket_last_active";

export function SessionTimeoutHandler() {
  const { isAuthenticated, logout } = useAuth();
  const warningToastId = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize last active timestamp
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());

    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;

    const performLogout = () => {
      if (warningToastId.current) {
        toast.dismiss(warningToastId.current);
        warningToastId.current = null;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("session_expired", "timeout");
      }
      toast.error("Session expired after 5 minutes of inactivity. Please sign in again.", {
        id: "session-expired",
        duration: 6000,
      });
      logout();
    };

    const showWarning = () => {
      warningToastId.current = toast(
        "You have been inactive for 4.5 minutes. Your session will expire in 30 seconds.",
        {
          id: "session-warning",
          icon: "⏳",
          duration: 30000,
        }
      );
    };

    const scheduleTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      const lastActive = parseInt(
        localStorage.getItem(STORAGE_KEY) || Date.now().toString(),
        10
      );
      const elapsed = Date.now() - lastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        performLogout();
        return;
      }

      const timeUntilWarning = Math.max(0, WARNING_TIMEOUT_MS - elapsed);
      const timeUntilLogout = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

      warningTimer = setTimeout(showWarning, timeUntilWarning);
      logoutTimer = setTimeout(performLogout, timeUntilLogout);
    };

    // Activity event handler (throttled to update localStorage at most once every 2 seconds)
    const handleActivity = () => {
      const lastActive = parseInt(
        localStorage.getItem(STORAGE_KEY) || "0",
        10
      );
      if (Date.now() - lastActive > 2000) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        if (warningToastId.current) {
          toast.dismiss(warningToastId.current);
          warningToastId.current = null;
        }
        scheduleTimers();
      }
    };

    // Tab visibility change (e.g. user minimized browser or switched tabs and returned after 5 minutes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastActive = parseInt(
          localStorage.getItem(STORAGE_KEY) || Date.now().toString(),
          10
        );
        const elapsed = Date.now() - lastActive;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          performLogout();
        } else {
          scheduleTimers();
        }
      }
    };

    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (warningToastId.current) {
          toast.dismiss(warningToastId.current);
          warningToastId.current = null;
        }
        scheduleTimers();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);

    scheduleTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isAuthenticated, logout]);

  return null;
}
