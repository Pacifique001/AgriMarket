"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown, Github, Linkedin, Mail, Sparkles } from "lucide-react"
import Link from "next/link"

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* Clean, Modern Background */}
            <div className="absolute inset-0 -z-10">
                {/* Soft gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-400/5" />

                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)/0.1) 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Soft vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
            </div>

            <div className="container px-4 md:px-6 relative">
                <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">

                    {/* Animated Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-sm">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Open to opportunities</span>
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
                            Building Secure
                            <span className="block text-primary mt-2">
                                & Intelligent Systems
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Hi, I'm <span className="font-semibold text-foreground">Pacifique Tuyizere</span>
                            <br className="sm:hidden" />
                            <span className="text-sm sm:text-base text-muted-foreground/80 block sm:inline sm:ml-1">
                                Software & Network Engineer
                            </span>
                        </p>
                    </motion.div>

                    {/* Quick Highlights - Replaces the long description */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="flex flex-wrap justify-center gap-3 text-sm"
                    >
                        {["Cybersecurity", "AI Solutions", "Scalable Platforms"].map((item) => (
                            <span
                                key={item}
                                className="px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground border border-border"
                            >
                                {item}
                            </span>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
                    >
                        <Button size="lg" className="group w-full sm:w-auto" asChild>
                            <Link href="/projects">
                                View Projects
                                <ArrowDown className="ml-2 h-4 w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                            <Link href="/contact">
                                <Mail className="mr-2 h-4 w-4" />
                                Get in Touch
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="flex gap-4 pt-4"
                    >
                        {[
                            { href: "https://github.com/Pacifique001", icon: Github, label: "GitHub" },
                            { href: "https://linkedin.com/in/tuyizerepacifique", icon: Linkedin, label: "LinkedIn" },
                            { href: "mailto:tuyizerepacifique053@gmail.com", icon: Mail, label: "Email" },
                        ].map((social) => (
                            <Link
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full hover:bg-accent transition-colors group"
                                aria-label={social.label}
                            >
                                <social.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        ))}
                    </motion.div>



                </div>
            </div>

            {/* Decorative Elements - Simplified */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl -z-10" />
        </section>
    )
}