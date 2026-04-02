import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import AIChat from "@/components/AIChat"

/* ================= SEO META TAGS ================= */
export const metadata: Metadata = {
  title: "Pacifique Tuyizere — Software & Network Engineer",
  description:
    "Portfolio of Pacifique Tuyizere, a Software & Network Engineer based in Kigali, Rwanda. Specialising in full-stack development, cybersecurity, AI systems, and IoT solutions.",
  keywords: [
    "Pacifique Tuyizere",
    "Software Engineer",
    "Network Engineer",
    "Cybersecurity",
    "Full-Stack Developer",
    "AI",
    "IoT",
    "Kigali",
    "Rwanda",
    "Portfolio",
  ],
  authors: [{ name: "Pacifique Tuyizere" }],
  openGraph: {
    title: "Pacifique Tuyizere — Software & Network Engineer",
    description:
      "Building secure and intelligent systems. Full-stack development, cybersecurity, and AI-powered solutions.",
    url: "https://pacifiquetuyizere.dev",
    siteName: "Pacifique Tuyizere Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pacifique Tuyizere — Software & Network Engineer",
    description:
      "Building secure and intelligent systems. Full-stack development, cybersecurity, and AI-powered solutions.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark">
          <TooltipProvider>
            <Navbar />
            <main className="pt-24 min-h-screen">
              {children}
            </main>
            <Footer />
            <AIChat />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
