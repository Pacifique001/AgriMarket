"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { testimonials } from "@/lib/testimonials-data"

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  const prev = () =>
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () =>
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))

  const t = testimonials[current]

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Heading */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">
            What People <span className="text-primary">Say</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Endorsements from colleagues, mentors, and collaborators I have had the privilege to work with.
          </p>
        </div>

        {/* Testimonial Card */}
        <Card className="glass relative overflow-hidden">
          <CardContent className="p-8 md:p-12">

            <Quote className="absolute top-6 left-6 h-10 w-10 text-primary/10" />

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
                className="space-y-6 text-center"
              >
                {/* Avatar placeholder */}
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {t.name.charAt(0)}
                </div>

                <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic max-w-2xl mx-auto">
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.role} &middot; {t.company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button variant="outline" size="icon" onClick={prev} aria-label="Previous testimonial">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === current ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <Button variant="outline" size="icon" onClick={next} aria-label="Next testimonial">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </section>
  )
}
