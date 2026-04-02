"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Briefcase, GraduationCap, Code2, Shield, Database, Smartphone } from "lucide-react"
import { certificates } from "./certifications"

/* ================= SKILL DATA WITH PROFICIENCY ================= */

const skillGroups = [
  {
    title: "Programming Languages",
    icon: Code2,
    skills: [
      { name: "Java", level: 90 },
      { name: "Python", level: 88 },
      { name: "JavaScript / Node.js", level: 85 },
      { name: "C / C++", level: 75 },
      { name: "Dart", level: 80 },
      { name: "Kotlin", level: 70 },
      { name: "PHP", level: 65 },
    ],
  },
  {
    title: "Web & Mobile Frameworks",
    icon: Smartphone,
    skills: [
      { name: "Flutter", level: 85 },
      { name: "React Native", level: 75 },
      { name: "Spring Boot", level: 82 },
      { name: "Django", level: 78 },
      { name: "Express.js", level: 80 },
      { name: "Flask", level: 72 },
      { name: "REST APIs", level: 90 },
    ],
  },
  {
    title: "Cybersecurity",
    icon: Shield,
    skills: [
      { name: "pfSense", level: 85 },
      { name: "Nessus", level: 80 },
      { name: "Burp Suite", level: 78 },
      { name: "WAZUH SIEM", level: 82 },
      { name: "VLAN Security", level: 88 },
      { name: "Penetration Testing", level: 75 },
    ],
  },
  {
    title: "Databases & DevOps",
    icon: Database,
    skills: [
      { name: "PostgreSQL", level: 85 },
      { name: "MySQL", level: 82 },
      { name: "MongoDB", level: 78 },
      { name: "Redis", level: 70 },
      { name: "Docker", level: 80 },
    ],
  },
]

/* ================= EXPERIENCE DATA ================= */

const experiences = [
  {
    role: "Software Engineering Intern",
    company: "berulo Foundation",
    period: "Mar 2025 – May 2025",
    location: "Kigali, Rwanda",
    achievements: [
      "Designed, developed, and tested software applications across the full stack.",
      "Optimised algorithms and improved system performance by profiling critical paths.",
      "Participated in code reviews and maintained high-quality engineering standards.",
    ],
  },
]

/* ================= EDUCATION DATA ================= */

const education = [
  {
    title: "BSc. Computer & Software Engineering",
    institution: "University of Rwanda",
    period: "May 2022 – Present",
  },
  {
    title: "A Level — Mathematics, Computer Science & Economics",
    institution: "GS APAPEC Murambi",
    period: "2018 – 2021",
  },
]

/* ================= MAIN PAGE ================= */

export default function AboutPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20 space-y-24">

      {/* ================= HERO ================= */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          {/* Image */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-72 h-72 rounded-2xl overflow-hidden border border-border shadow-xl">
              <Image
                src="/profile.png"
                alt="Pacifique Tuyizere"
                fill
                priority
                className="object-cover hover:scale-105 transition duration-500"
              />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              About <span className="text-primary">Me</span>
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              I am{" "}
              <span className="font-semibold text-foreground">Pacifique Tuyizere</span>,
              an innovative Software &amp; Network Engineer based in Kigali, Rwanda.
              I specialize in designing secure, scalable systems and building
              intelligent digital infrastructures.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              My expertise spans full-stack development, cybersecurity,
              AI-driven systems, and IoT solutions. I enjoy solving
              complex technical challenges and transforming ideas
              into high-performance applications.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Badge>Full-Stack Development</Badge>
              <Badge>Cybersecurity</Badge>
              <Badge>AI &amp; Intelligent Systems</Badge>
              <Badge>Network Engineering</Badge>
            </div>

            <div className="pt-2">
              <Button asChild>
                <a href="/Pacifique_Tuyizere_CV.pdf" download>
                  Download CV
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================= PROFESSIONAL SUMMARY ================= */}
      <section>
        <Card className="glass">
          <CardContent className="p-8 space-y-4">
            <h2 className="text-2xl font-semibold">Professional Summary</h2>
            <p className="text-muted-foreground leading-relaxed">
              Innovative software and network engineer with a strong foundation in coding and network management.
              Proven ability to lead projects from concept to completion while ensuring optimal performance and security.
              Excited to contribute technical expertise in software engineering, cybersecurity, and network security
              within environments that foster growth and technological excellence.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ================= SKILLS WITH PROGRESS BARS ================= */}
      <section className="space-y-10">
        <h2 className="text-3xl font-bold">Skills &amp; Technologies</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {skillGroups.map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: gi * 0.1 }}
            >
              <Card className="glass h-full">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <group.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{group.title}</h3>
                  </div>

                  <div className="space-y-4">
                    {group.skills.map((skill, si) => (
                      <div key={skill.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground font-medium">{skill.name}</span>
                          <span className="text-muted-foreground">{skill.level}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.8,
                              delay: gi * 0.1 + si * 0.05,
                              ease: "easeOut",
                            }}
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= EXPERIENCE TIMELINE ================= */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="h-7 w-7 text-primary" />
          Experience
        </h2>

        <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
          {experiences.map((exp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              {/* Dot */}
              <div className="absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />

              <Card className="glass">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-xl font-semibold">{exp.role}</h3>
                  <p className="text-muted-foreground">
                    {exp.company} &middot; {exp.period}
                  </p>
                  <p className="text-sm text-muted-foreground">{exp.location}</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 pt-2">
                    {exp.achievements.map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= FEATURED PROJECT ================= */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Featured Project</h2>
        <Card className="glass">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-xl font-semibold">
              Federated AIOps Framework for 5G-IoT Security
            </h3>
            <p className="text-muted-foreground">Architect &amp; Lead Developer</p>
            <p className="text-muted-foreground">
              Research-driven security framework addressing critical 5G-IoT
              vulnerabilities using federated learning to enhance distributed
              network security and threat detection.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ================= EDUCATION TIMELINE ================= */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          Education
        </h2>

        <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
          {education.map((edu, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="absolute -left-[25px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
              <Card className="glass">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{edu.title}</h3>
                  <p className="text-muted-foreground">{edu.institution}</p>
                  <p className="text-muted-foreground text-sm">{edu.period}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CERTIFICATIONS LIST ================= */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Certifications</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li>Cybersecurity Essential Skills Program – A+ (85/85)</li>
          <li>IoT Certification – LoRaWAN Specialization</li>
          <li>Cisco Switching, Routing &amp; Wireless Essentials</li>
        </ul>
      </section>

      {/* ================= CERTIFICATIONS CARDS ================= */}
      <section className="space-y-10">
        <h2 className="text-3xl font-bold">Certificate Gallery</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass hover:scale-[1.02] transition">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Award className="text-primary" />
                    <h3 className="text-lg font-semibold">{cert.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{cert.issuer}</p>
                  <p className="text-sm text-muted-foreground">{cert.date}</p>
                  <Button asChild size="sm">
                    <a href={cert.file} target="_blank">
                      View Certificate
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= LANGUAGES ================= */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">Languages</h2>
        <div className="flex gap-4 flex-wrap">
          <Badge>English – Advanced</Badge>
          <Badge>Kinyarwanda – Native</Badge>
          <Badge>French – Elementary</Badge>
        </div>
      </section>
    </main>
  )
}
