"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Github, Filter } from "lucide-react"

/* ================= PROJECT DATA ================= */

interface Project {
  title: string
  description: string
  longDescription: string
  category: string
  tags: string[]
  images: string[]
  status: "In Development" | "Completed" | "Research"
  liveUrl?: string
  githubUrl?: string
  isMobile?: boolean
}

const projects: Project[] = [
  {
    title: "Federated AIOps Framework for 5G-IoT Security",
    description:
      "AI-driven security architecture using federated learning for anomaly detection in distributed 5G-enabled IoT systems.",
    longDescription:
      "A research-driven security framework addressing critical 5G-IoT vulnerabilities. The system uses federated learning to train distributed anomaly detection models across edge devices without centralising sensitive data. It features a three-tier architecture (edge, fog, cloud), gRPC communication with mutual TLS, and robust aggregation algorithms to defend against adversarial model-poisoning attacks. Early results show 94.3% detection accuracy with a 73% reduction in transmitted data.",
    category: "AI & Cybersecurity",
    tags: ["Federated Learning", "Python", "5G", "IoT", "gRPC", "TensorFlow"],
    images: [
      "/projects/aiops1.png",
      "/projects/aiops2.png",
      "/projects/aiops3.png",
      "/projects/aiops4.png",
      "/projects/aiops5.png",
      "/projects/aiops6.png",
    ],
    status: "Research",
  },
  {
    title: "MamaCare Mobile Application",
    description:
      "Cross-platform Flutter app supporting maternal healthcare tracking in low-connectivity environments.",
    longDescription:
      "MamaCare is built with Flutter and implements an offline-first synchronisation protocol using local SQLite storage, background connectivity monitoring, and conflict resolution with server timestamps. It features role-based access control for community health workers, nurses, and administrators. The multi-layer architecture ensures reliability, data integrity, and scalability even in regions with intermittent network coverage.",
    category: "Mobile Development",
    tags: ["Flutter", "Dart", "SQLite", "Offline-First", "Role-Based Access"],
    images: [
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
    ],
    status: "In Development",
    isMobile: true,
  },
  {
    title: "Agricultural Market Analytics Platform",
    description:
      "Data-driven analytics system for modeling farmer revenue trends, price deviations, and supply-demand equilibrium.",
    longDescription:
      "A full-stack analytics platform that ingests market data from multiple sources, applies statistical aggregation and temporal modeling to identify revenue trends, and visualises supply-demand dynamics. Features include interactive dashboards with time-range selectors, comparative price-deviation charts, and automated alerts when metrics breach configurable thresholds.",
    category: "Full-Stack",
    tags: ["React", "Node.js", "PostgreSQL", "Data Analytics", "REST API"],
    images: [
      "/projects/agri1.png",
      "/projects/agri2.png",
      "/projects/agri3.png",
      "/projects/agri4.png",
      "/projects/agri5.png",
      "/projects/agri6.png",
      "/projects/agri7.png",
    ],
    status: "In Development",
  },
]

const categories = ["All", "AI & Cybersecurity", "Mobile Development", "Full-Stack"]

/* ================= MAIN PAGE ================= */

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const filtered =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory)

  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-16">

      {/* Header */}
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

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3"
      >
        <Filter className="h-5 w-5 text-muted-foreground self-center mr-1" />
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </motion.div>

      {/* Project cards */}
      <div className="space-y-12">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => (
            <motion.div
              key={project.title}
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="glass overflow-hidden">
                <CardContent className="p-8 space-y-6">

                  {/* Title + Status */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold">{project.title}</h2>
                    <Badge
                      variant="outline"
                      className={
                        project.status === "Research"
                          ? "border-blue-500 text-blue-500"
                          : "border-yellow-500 text-yellow-500"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed max-w-4xl">
                    {project.description}
                  </p>

                  {/* Images */}
                  <div
                    className={`grid gap-4 pt-4 ${
                      project.isMobile ? "grid-cols-2 md:grid-cols-4" : "md:grid-cols-3"
                    }`}
                  >
                    {project.images.slice(0, project.isMobile ? 8 : 6).map((img, index) => (
                      <div
                        key={index}
                        className={`relative rounded-xl overflow-hidden border border-border hover:scale-105 transition duration-500 ${
                          project.isMobile ? "h-64" : "h-48"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button onClick={() => setSelectedProject(project)}>
                      View Details
                    </Button>
                    {project.githubUrl && (
                      <Button variant="outline" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {project.liveUrl && (
                      <Button variant="outline" asChild>
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Live Demo
                        </a>
                      </Button>
                    )}
                    {!project.githubUrl && !project.liveUrl && (
                      <Button variant="outline" disabled>
                        Not Publicly Hosted Yet
                      </Button>
                    )}
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No projects in this category.</p>
        </div>
      )}

      {/* ================= PROJECT DETAIL MODAL ================= */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 space-y-6 shadow-2xl"
            >
              {/* Close */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={
                      selectedProject.status === "Research"
                        ? "border-blue-500 text-blue-500"
                        : "border-yellow-500 text-yellow-500"
                    }
                  >
                    {selectedProject.status}
                  </Badge>
                  <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProject(null)}
                  className="shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Category + Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{selectedProject.category}</Badge>
                {selectedProject.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Long description */}
              <p className="text-muted-foreground leading-relaxed">
                {selectedProject.longDescription}
              </p>

              {/* Gallery */}
              <div
                className={`grid gap-3 ${
                  selectedProject.isMobile ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                {selectedProject.images.map((img, i) => (
                  <div
                    key={i}
                    className={`relative rounded-lg overflow-hidden border border-border ${
                      selectedProject.isMobile ? "h-48" : "h-36"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={selectedProject.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {selectedProject.githubUrl && (
                  <Button asChild>
                    <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      View Source
                    </a>
                  </Button>
                )}
                {selectedProject.liveUrl && (
                  <Button asChild>
                    <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Live Demo
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedProject(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
