import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn (Class Names) Utility
 * 
 * Combines 'clsx' and 'tailwind-merge'.
 * 1. clsx: Allows for conditional classes (e.g. { 'bg-red-500': hasError })
 * 2. tailwind-merge: Intelligently merges Tailwind classes to prevent 
 *    style conflicts (e.g. 'px-2 px-4' becomes 'px-4').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency Formatter
 * Useful for displaying prices in Rwandan Francs (RWF)
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Date Formatter
 * Standardizes date displays across the platform
 */
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};