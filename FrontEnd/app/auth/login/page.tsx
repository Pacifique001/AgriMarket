"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Lock, LogIn, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import axios from "axios";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// 1. Validation Schema
const loginSchema = z.object({
  phone: z.string().min(10, "Phone number is too short"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Mapping roles to their respective dashboard paths
const ROLE_REDIRECTS = {
  farmer: "/dashboard/farmer/dashboard",
  buyer: "/dashboard/buyer/dashboard",
  admin: "/dashboard/admin/dashboard",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTimeout =
        sessionStorage.getItem("session_expired") === "timeout" ||
        window.location.search.includes("reason=timeout");
      if (isTimeout) {
        setSessionExpiredNotice(true);
        sessionStorage.removeItem("session_expired");
      }
    }
  }, []);

  // 2. Session Guard: Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user?.role) {
      const path = ROLE_REDIRECTS[user.role as keyof typeof ROLE_REDIRECTS] || "/";
      router.replace(path);
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // 3. Initialize Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  // 4. Login Handler
  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      // FastAPI OAuth2 expects FormData
      const formData = new FormData();
      formData.append("username", data.phone);
      formData.append("password", data.password);

      const response = await authService.login(formData);

      // Update global state (this also saves to LocalStorage via Zustand Middleware)
      setAuth(response.access_token);

      toast.success("Welcome back!");

      // Role-Based Redirection logic using the mapping
      const role = response.role.toLowerCase() as keyof typeof ROLE_REDIRECTS;
      const destination = ROLE_REDIRECTS[role] || "/";
      router.push(destination);

    } catch (error: unknown) {
      const errorMsg =
        axios.isAxiosError(error)
          ? (error.response?.data as { detail?: string } | undefined)?.detail || "Invalid phone number or password"
          : "Invalid phone number or password";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent "flash" of login form if user is already authenticated
  if (!_hasHydrated || (isAuthenticated && user)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/85">
        <Loader2 className="animate-spin text-green-700" size={32} />
        <p className="text-slate-500 text-sm mt-4 font-medium">Verifying session...</p>
      </div>
    );
  }

   return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Welcome Back</h2>
        <p className="text-slate-500 text-xs font-medium">Log in to your marketplace account</p>
      </div>

      {sessionExpiredNotice && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Session Inactivity Timeout</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Your session expired after 5 minutes of tab inactivity to protect your account. Please sign in again.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              placeholder="078..."
              className={cn(
                "input-field h-10 pl-9 text-sm",
                errors.phone && "border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.phone && (
            <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle size={11} /> {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-green-700 font-bold hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                "input-field h-10 pl-9 text-sm",
                errors.password && "border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle size={11} /> {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-sm font-semibold shadow-md"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Sign In <LogIn size={16} />
            </>
          )}
        </button>
      </form>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200"></span>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
          <span className="bg-white px-3 text-slate-400 font-bold">New to AgroMarket?</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/register"
          className="inline-block w-full border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-all"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}