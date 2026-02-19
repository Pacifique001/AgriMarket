import Hero from "@/components/Hero"

export default function Home() {
  return (
    <>
      <Hero />

      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-6">
          What I Do
        </h2>
        <p className="max-w-2xl mx-auto text-muted-foreground">
          I design and develop secure software systems, implement cybersecurity frameworks,
          and build AI-powered solutions that solve real-world problems.
        </p>
      </section>
    </>
  )
}
