"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function ProjectsPage() {
    return (
        <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">

            {/* ================= HEADER ================= */}
            <section className="text-center space-y-6">
                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-6xl font-bold"
                >
                    My <span className="text-primary">Projects</span>
                </motion.h1>

                <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
                    Selected works demonstrating my expertise in applied mathematics,
                    distributed systems, AI modeling, and software architecture.
                </p>
            </section>

            {/* ================= PROJECTS ================= */}
            <div className="space-y-12">

                <ProjectCard
                    title="Federated AIOps Framework for 5G-IoT Security"
                    description="AI-driven security architecture using federated learning for anomaly detection in distributed 5G-enabled IoT systems. Designed with optimization, statistical modeling, and resource-constrained deployment strategies."
                    images={[
                        "/projects/aiops1.png",
                        "/projects/aiops2.png",
                        "/projects/aiops3.png",
                        "/projects/aiops4.png",
                        "/projects/aiops5.png",
                        "/projects/aiops6.png",
                    ]}
                />

                <MamaCareProject />
                <ProjectCard
                    title="Agricultural Market Analytics Platform"
                    description="Data-driven analytics system for modeling farmer revenue trends, price deviations, and supply-demand equilibrium using statistical aggregation and temporal modeling."
                    images={[
                        "/projects/agri1.png",
                        "/projects/agri2.png",
                        "/projects/agri3.png",
                        "/projects/agri4.png",
                        "/projects/agri5.png",
                        "/projects/agri6.png",
                        "/projects/agri7.png",
                    ]}
                />

            </div>

        </main>
    )
}


/* ================= PROJECT CARD ================= */

function ProjectCard({ title, description, images }: any) {
    return (
        <Card className="glass overflow-hidden">
            <CardContent className="p-8 space-y-6">

                {/* Title + Status */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        {title}
                    </h2>

                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        In Development
                    </Badge>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed max-w-4xl">
                    {description}
                </p>

                {/* Images Gallery */}
                <div className="grid md:grid-cols-3 gap-4 pt-4">
                    {images.map((img: string, index: number) => (
                        <div
                            key={index}
                            className="relative h-48 rounded-xl overflow-hidden border border-border hover:scale-105 transition duration-500"
                        >
                            <Image
                                src={img}
                                alt={title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                    <Button variant="outline" disabled>
                        Not Publicly Hosted Yet
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
function MamaCareProject() {
    return (
        <Card className="glass overflow-hidden">
            <CardContent className="p-8 space-y-6">

                {/* Title + Status */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        MamaCare Mobile Application
                    </h2>

                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        In Development
                    </Badge>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-3">
                    <Badge>Flutter</Badge>
                    <Badge>Dart</Badge>
                    <Badge>Offline-First</Badge>
                    <Badge>Role-Based Access</Badge>
                    <Badge>Synchronization Algorithm</Badge>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed max-w-4xl">
                    MamaCare is a cross-platform mobile application built with Flutter,
                    designed to support maternal healthcare tracking in low-connectivity environments.
                    The system implements an offline-first synchronization protocol,
                    role-based access control, and structured multi-layer architecture
                    to ensure reliability, data integrity, and scalability.
                </p>

                {/* Mobile Screenshots */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">

                    {[
                        "/projects/mamacare1.png",
                        "/projects/mamacare2.png",
                        "/projects/mamacare3.png",
                        "/projects/mamacare4.png",
                        "/projects/mamacare5.png",
                        "/projects/mamacare6.png",
                        "/projects/mamacare7.png",
                        "/projects/mamacare8.png",
                        "/projects/mamacare9.png",
                        "/projects/mamacare10.png",
                        "/projects/mamacare11.png",

                    ].map((img, index) => (
                        <div
                            key={index}
                            className="relative h-64 rounded-xl overflow-hidden border border-border hover:scale-105 transition duration-500"
                        >
                            <Image
                                src={img}
                                alt="MamaCare Screenshot"
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}

                </div>

                <div className="pt-4">
                    <Button variant="outline" disabled>
                        Mobile Application – Not Publicly Released
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
