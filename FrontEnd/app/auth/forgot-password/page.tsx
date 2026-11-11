"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Loader2, AlertCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

import { authService } from "@/services/auth";
import { cn } from "@/lib/utils";

const forgotSchema = z.object({
  phone: z.string().min(10, "Phone number is too short"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotValues) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.phone);
      setIsSubmitted(true);
      toast.success("Reset instructions sent");
    } catch (error: unknown) {
      const errorMsg =
        axios.isAxiosError(error)
          ? (error.response?.data as { detail?: string } | undefined)?.detail || "Could not send reset instructions"
          : "Could not send reset instructions";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Forgot Password?</h2>
        <p className="text-xs text-slate-500 font-medium">Enter your phone number to receive reset instructions</p>
      </div>

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

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-sm font-semibold shadow-md"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Send Instructions <Send size={16} />
            </>
          )}
        </button>
      </form>

      {isSubmitted && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          If this phone number exists, reset instructions have been sent.
        </div>
      )}

      <div className="pt-1 text-center space-y-1.5">
        <Link href="/auth/reset-password" className="block text-xs font-bold text-green-700 hover:underline">
          Have a reset code? Reset password
        </Link>
        <Link href="/auth/login" className="block text-xs text-slate-500 hover:underline">
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}
