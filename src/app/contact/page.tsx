"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  Send
} from "lucide-react"

/* ================= CONTACT CARD COMPONENT ================= */
function ContactCard({ icon, title, value, link }: {
  icon: React.ReactNode
  title: string
  value: string
  link?: string
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/40">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors break-words"
              >
                {value}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================= MAIN CONTACT PAGE ================= */
export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Simulate submission
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)

      // Reset form and success message
      setTimeout(() => setSuccess(false), 5000)
    }, 1500)
  }

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* ================= HEADER ================= */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Get in Touch</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground"
          >
            Let's{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Work Together
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            Open to software engineering, cybersecurity, research, and collaboration opportunities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button size="lg" asChild>
              <a href="/Pacifique_Tuyizere_CV.pdf" download>
                Download CV
              </a>
            </Button>
          </motion.div>
        </section>

        {/* ================= CONTACT GRID ================= */}
        <section className="grid lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ===== LEFT SIDE - CONTACT INFO ===== */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Contact Information</h2>
              <p className="text-muted-foreground text-sm">Reach out through any of these channels</p>
            </div>

            <div className="space-y-4">
              <ContactCard
                icon={<Mail size={20} />}
                title="Email"
                value="tuyizerepacifique053@gmail.com"
                link="mailto:tuyizerepacifique053@gmail.com"
              />

              <ContactCard
                icon={<Phone size={20} />}
                title="Phone"
                value="+250 789 215 493"
                link="tel:+250789215493"
              />

              <ContactCard
                icon={<MapPin size={20} />}
                title="Location"
                value="Kigali, Rwanda"
              />
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Social Media</h3>
              <div className="space-y-3">
                <ContactCard
                  icon={<Linkedin size={20} />}
                  title="LinkedIn"
                  value="Pacifique Tuyizere"
                  link="https://linkedin.com/in/pacifique-tuyizere-39472772b"
                />

                <ContactCard
                  icon={<Github size={20} />}
                  title="GitHub"
                  value="@Pacifique001"
                  link="https://github.com/Pacifique001"
                />

                <ContactCard
                  icon={<Facebook size={20} />}
                  title="Facebook"
                  value="Pacifique Tuyizere"
                  link="https://web.facebook.com/profile.php?id=61558524676159"
                />

                <ContactCard
                  icon={<Instagram size={20} />}
                  title="Instagram"
                  value="@tuyizerepacifique053"
                  link="https://www.instagram.com/tuyizerepacifique053/"
                />
              </div>
            </div>
          </motion.div>

          {/* ===== RIGHT SIDE - FORM ===== */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="border-border/40">
              <CardContent className="p-8 space-y-6">

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Send a Message
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form and I'll get back to you soon.
                  </p>
                </div>

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      Message sent successfully! I will get back to you soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <Input
                      placeholder="Your full name"
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <Input
                      placeholder="What is this about?"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea
                      placeholder="Tell me more about your project or inquiry..."
                      rows={6}
                      required
                      className="bg-background resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                </form>

              </CardContent>
            </Card>
          </motion.div>

        </section>

      </div>
    </main>
  )
}