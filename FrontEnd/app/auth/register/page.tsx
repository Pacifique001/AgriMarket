"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sprout,
  ShoppingCart,
  User,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// 1. Define Validation Schema
const registerSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(10, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be 72 characters or fewer"),
  role: z.enum(["farmer", "buyer"]),
});

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_REDIRECTS = {
  farmer: "/farmer/dashboard",
  buyer: "/buyer/dashboard",
  admin: "/admin/dashboard",
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, user } = useAuth();
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "farmer",
    },
  });

  const selectedRole = watch("role");

  // 4. Form Submission Handler
  const onSubmit = async (data: RegisterValues) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success("Account created successfully! Please log in.");
      router.push("/auth/login");
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Registration failed. Try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch "flicker"
  if (!_hasHydrated) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-green-700" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-center space-y-2 lg:text-left">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
        <p className="text-slate-500 text-sm font-medium">Join the Rwandan agricultural marketplace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Role Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <button
            type="button"
            onClick={() => setValue("role", "farmer")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
              selectedRole === "farmer"
                ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
            )}
          >
            <Sprout size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest">I'm a Farmer</span>
          </button>

          <button
            type="button"
            onClick={() => setValue("role", "buyer")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
              selectedRole === "buyer"
                ? "border-green-600 bg-green-50 text-green-700 shadow-sm"
                : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
            )}
          >
            <ShoppingCart size={28} />
            <span className="text-[10px] font-black uppercase tracking-widest">I'm a Buyer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                {...register("full_name")}
                type="text"
                autoComplete="name"
                placeholder="e.g., Jean Paul"
                className={cn(
                  "input-field pl-10",
                  errors.full_name && "border-red-500 focus:ring-red-500"
                )}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
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
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-4 text-base shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Create Account <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-sm text-slate-600 font-medium">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-green-700 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}