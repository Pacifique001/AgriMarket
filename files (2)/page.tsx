"use client"

import Link from "next/link"
import Hero from "@/components/Hero"
import Testimonials from "@/components/Testimonials"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Shield,
  Brain,
  Code2,
  Network,
  ArrowRight,
  Clock,
  BookOpen,
} from "lucide-react"
import { blogPosts } from "@/lib/blog-data"

const services = [
  {
    icon: Code2,
    title: "Full-Stack Development",
    description:
      "Building scalable web and mobile applications with modern frameworks like Spring Boot, React, Flutter, and Django.",
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description:
      "Implementing security frameworks, penetration testing, SIEM monitoring, and network segmentation with tools like pfSense and WAZUH.",
  },
  {
    icon: Brain,
    title: "AI & Intelligent Systems",
    description:
      "Designing AI-powered solutions including federated learning architectures, anomaly detection, and data-driven analytics platforms.",
  },
  {
    icon: Network,
    title: "Network Engineering",
    description:
      "Architecting secure network infrastructures with VLAN segmentation, firewall management, and IoT connectivity solutions.",
  },
]

export default function Home() {
  const recentPosts = blogPosts.slice(0, 3)

  return (
    <>
      <Hero />

      {/* ================= WHAT I DO ================= */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold"
            >
              What I Do
            </motion.h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              I design and develop secure software systems, implement cybersecurity frameworks,
              and build AI-powered solutions that solve real-world problems.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="glass h-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <Testimonials />

      {/* ================= RECENT BLOG POSTS ================= */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold">
                Latest <span className="text-primary">Articles</span>
              </h2>
              <p className="text-muted-foreground max-w-lg">
                Insights from my work in software engineering, cybersecurity, and AI.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/blog">
                View All Posts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <Card className="h-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/40 hover:border-primary/20 overflow-hidden">
                    <div className="relative h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/20" />
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-2">
                      <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
