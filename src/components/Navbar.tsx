"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Download, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const { theme, setTheme } = useTheme()

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Projects", href: "/projects" },
        { name: "Contact", href: "/contact" },
    ]

    return (
        <header className="fixed top-0 left-0 right-0 w-full z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* ===== LOGO ===== */}
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
                    >
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Pacifique
                        </span>
                    </Link>

                    {/* ===== CENTER: DESKTOP NAV LINKS ===== */}
                    {/* This should be VISIBLE on screens 768px and wider */}
                    <div className="hidden md:block">
                        <div className="flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-md ${pathname === link.href
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {link.name}
                                    {pathname === link.href && (
                                        <motion.span
                                            layoutId="navbar-underline"
                                            className="absolute left-0 bottom-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                                            transition={{
                                                type: "spring",
                                                stiffness: 380,
                                                damping: 30
                                            }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ===== RIGHT: DESKTOP ACTIONS ===== */}
                    {/* This should be VISIBLE on screens 768px and wider */}
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3">

                            {/* Theme Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="h-9 w-9"
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* CV Button */}
                            <Button asChild size="sm">
                                <a href="/Pacifique_Tuyizere_CV.pdf" download>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download CV
                                </a>
                            </Button>

                        </div>
                    </div>

                    {/* ===== RIGHT: MOBILE ACTIONS ===== */}
                    {/* This should be VISIBLE only on screens below 768px */}
                    <div className="block md:hidden">
                        <div className="flex items-center gap-2">

                            {/* Mobile Theme Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="h-9 w-9"
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* Hamburger Menu */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setOpen(!open)}
                                className="h-9 w-9"
                            >
                                {open ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                                <span className="sr-only">Toggle menu</span>
                            </Button>

                        </div>
                    </div>
                </div>

                {/* ===== MOBILE MENU ===== */}
                {/* This should ONLY appear on mobile when hamburger is clicked */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="md:hidden overflow-hidden border-t border-border/40"
                        >
                            <div className="flex flex-col space-y-1 py-4">

                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${pathname === link.href
                                            ? "text-foreground bg-accent/20"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="pt-3">
                                    <Button asChild className="w-full" size="sm">
                                        <a href="/Pacifique_Tuyizere_CV.pdf" download onClick={() => setOpen(false)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download CV
                                        </a>
                                    </Button>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </nav>
        </header>
    )
}