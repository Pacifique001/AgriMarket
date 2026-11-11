"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { KeyRound, Lock, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

const resetSchema = z
  .object({
    code: z.string().min(4, "Reset code is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be 72 characters or fewer"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (values: ResetValues) => {
    setIsLoading(true);
    try {
      // TODO: call the backend reset endpoint with values.code and values.newPassword
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Password reset successful. Please log in.");
    } catch {
      toast.error("Could not reset password right now");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Reset Password</h2>
        <p className="text-xs text-slate-500 font-medium">Enter your code and choose a new password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Reset Code</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              {...register("code")}
              type="text"
              placeholder="Enter code"
              className={cn("input-field h-10 pl-9 text-sm", errors.code && "border-red-500 focus:ring-red-500")}
            />
          </div>
          {errors.code && (
            <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle size={11} /> {errors.code.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              {...register("newPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                "input-field h-10 pl-9 text-sm",
                errors.newPassword && "border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.newPassword && (
            <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle size={11} /> {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              {...register("confirmPassword")}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn(
                "input-field h-10 pl-9 text-sm",
                errors.confirmPassword && "border-red-500 focus:ring-red-500"
              )}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1 font-medium">
              <AlertCircle size={11} /> {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-sm font-semibold shadow-md"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Reset Password"}
        </button>
      </form>

      <div className="pt-1 text-center">
        <Link href="/auth/login" className="text-xs text-slate-500 font-medium hover:underline">
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}