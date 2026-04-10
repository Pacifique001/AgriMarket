import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "AgroMarket AI | Farmer-Market Connection",
    template: "%s | AgroMarket AI",
  },
  description: "AI-powered platform connecting Rwandan farmers directly to market demand and fair pricing.",
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {/* IMPORTANT: YOU MUST RENDER CHILDREN HERE */}
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}