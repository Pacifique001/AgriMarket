"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award } from "lucide-react"
import { certificates } from "./certifications"

export default function AboutPage() {
    return (
        <main className="max-w-6xl mx-auto px-6 py-20 space-y-20">

            {/* ================= HERO WITH IMAGE ================= */}
            <section>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                >

                    {/* ===== IMAGE LEFT ===== */}
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

                    {/* ===== TEXT RIGHT ===== */}
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold">
                            About <span className="text-primary">Me</span>
                        </h1>

                        <p className="text-muted-foreground text-lg leading-relaxed">
                            I am <span className="font-semibold text-foreground">
                                Pacifique Tuyizere
                            </span>, an innovative Software & Network Engineer based in Kigali, Rwanda.
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
                            <Badge>AI & Intelligent Systems</Badge>
                            <Badge>Network Engineering</Badge>
                        </div>
                    </div>

                </motion.div>
            </section>


            {/* ================= SUMMARY ================= */}
            <section>
                <Card className="glass">
                    <CardContent className="p-8 space-y-4">
                        <h2 className="text-2xl font-semibold">Professional Summary</h2>
                        <p className="text-muted-foreground">
                            Innovative software and network engineer with a strong foundation in coding and network management.
                            Proven ability to lead projects from concept to completion while ensuring optimal performance and security.
                            Excited to contribute technical expertise in software engineering, cybersecurity, and network security
                            within environments that foster growth and technological excellence.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* ================= SKILLS ================= */}
            <section className="space-y-8">
                <h2 className="text-3xl font-bold">Skills & Technologies</h2>

                <div className="grid md:grid-cols-2 gap-6">

                    <SkillCard
                        title="Programming Languages"
                        skills={["Java", "Python", "JavaScript (Node.js)", "C/C++", "PHP", "Dart", "Kotlin"]}
                    />

                    <SkillCard
                        title="Web & Mobile"
                        skills={[
                            "React Native",
                            "Flutter",
                            "Spring Boot",
                            "Django",
                            "Flask",
                            "Express.js",
                            "REST APIs"
                        ]}
                    />

                    <SkillCard
                        title="Cybersecurity"
                        skills={[
                            "pfSense",
                            "Nessus",
                            "Burp Suite",
                            "WAZUH SIEM",
                            "VLAN Security",
                            "Penetration Testing"
                        ]}
                    />

                    <SkillCard
                        title="Databases & DevOps"
                        skills={[
                            "PostgreSQL",
                            "MySQL",
                            "MongoDB",
                            "Redis",
                            "Docker"
                        ]}
                    />

                </div>
            </section>

            {/* ================= EXPERIENCE ================= */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold">Experience</h2>

                <Card className="glass">
                    <CardContent className="p-6 space-y-3">
                        <h3 className="text-xl font-semibold">
                            Software Engineering Intern – berulo Foundation
                        </h3>
                        <p className="text-muted-foreground">Mar 2025 – May 2025 | Kigali</p>

                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Designed, developed and tested software applications.</li>
                            <li>Optimized algorithms and improved system performance.</li>
                            <li>Participated in code reviews and maintained high-quality standards.</li>
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* ================= PROJECT ================= */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold">Featured Project</h2>

                <Card className="glass">
                    <CardContent className="p-6 space-y-3">
                        <h3 className="text-xl font-semibold">
                            Federated AIOps Framework for 5G-IoT Security
                        </h3>
                        <p className="text-muted-foreground">
                            Architect & Lead Developer
                        </p>
                        <p className="text-muted-foreground">
                            Research-driven security framework addressing critical 5G-IoT
                            vulnerabilities using federated learning to enhance distributed
                            network security and threat detection.
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* ================= EDUCATION ================= */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold">Education</h2>

                <TimelineItem
                    title="BSc. Computer & Software Engineering"
                    institution="University of Rwanda"
                    period="May 2022 – Present"
                />

                <TimelineItem
                    title="A Level – Mathematics, Computer Science & Economics"
                    institution="GS APAPEC Murambi"
                    period="2018 – 2021"
                />
            </section>

            {/* ================= CERTIFICATIONS ================= */}
            <section className="space-y-6">
                <h2 className="text-3xl font-bold">Certifications</h2>

                <ul className="space-y-3 text-muted-foreground">
                    <li>Cybersecurity Essential Skills Program – A+ (85/85)</li>
                    <li>IoT Certification – LoRaWAN Specialization</li>
                    <li>Cisco Switching, Routing & Wireless Essentials</li>
                </ul>
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
            <section className="space-y-10">
                <h2 className="text-3xl font-bold">Certifications</h2>

                <div className="grid md:grid-cols-2 gap-6">

                    {certificates.map((cert) => (
                        <Card key={cert.title} className="glass hover:scale-105 transition">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Award className="text-primary" />
                                    <h3 className="text-lg font-semibold">{cert.title}</h3>
                                </div>

                                <p className="text-muted-foreground">
                                    {cert.issuer}
                                </p>

                                <p className="text-sm text-muted-foreground">
                                    {cert.date}
                                </p>

                                <Button asChild size="sm">
                                    <a href={cert.file} target="_blank">
                                        View Certificate
                                    </a>
                                </Button>

                            </CardContent>
                        </Card>
                    ))}

                </div>
            </section>


        </main>
    )
}

/* ================= COMPONENTS ================= */

function SkillCard({ title, skills }: any) {
    return (
        <Card className="glass">
            <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">{title}</h3>
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string) => (
                        <Badge key={skill}>{skill}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function TimelineItem({ title, institution, period }: any) {
    return (
        <Card className="glass">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-muted-foreground">{institution}</p>
                <p className="text-muted-foreground text-sm">{period}</p>
            </CardContent>
        </Card>
    )
}
