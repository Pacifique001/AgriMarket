"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

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

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Invalid phone number or password";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent "flash" of login form if user is already authenticated
  if (!_hasHydrated || (isAuthenticated && user)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-green-700" size={32} />
        <p className="text-slate-500 text-sm mt-4 font-medium">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2 lg:text-left">
        <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
        <p className="text-slate-500 text-sm font-medium">Log in to manage your marketplace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Number Input */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                placeholder="078..."
                className={cn(
                  "input-field pl-10",
                  errors.phone && "border-red-500 focus:ring-red-500"
                )}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.phone.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex justify-between gap-3">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <Link href="#" className="text-xs text-green-700 font-bold hover:underline whitespace-nowrap">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  "input-field pl-10",
                  errors.password && "border-red-500 focus:ring-red-500"
                )}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4 text-base md:col-span-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Sign In <LogIn size={18} />
            </>
          )}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest">
          <span className="bg-white px-4 text-slate-400 font-bold">New to AgroMarket?</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/register"
          className="inline-block w-full border-2 border-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}