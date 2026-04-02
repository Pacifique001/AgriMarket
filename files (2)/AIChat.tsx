"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, X, Send, Sparkles, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  role: "user" | "assistant"
  content: string
}

/* ===================================================================
   Knowledge base used by the local AI to answer portfolio questions.
   This keeps the feature functional without requiring an external API.
   =================================================================== */

const PORTFOLIO_CONTEXT = `
Pacifique Tuyizere — Software & Network Engineer based in Kigali, Rwanda.

SKILLS: Java, Python, JavaScript (Node.js), C/C++, PHP, Dart, Kotlin, React Native, Flutter, Spring Boot, Django, Flask, Express.js, REST APIs, pfSense, Nessus, Burp Suite, WAZUH SIEM, VLAN Security, Penetration Testing, PostgreSQL, MySQL, MongoDB, Redis, Docker.

PROJECTS:
1. Federated AIOps Framework for 5G-IoT Security — AI-driven security using federated learning for anomaly detection in distributed 5G-IoT systems. Status: In Development.
2. MamaCare Mobile Application — Flutter-based maternal healthcare tracker with offline-first sync, role-based access control. Status: In Development.
3. Agricultural Market Analytics Platform — Data-driven analytics for farmer revenue trends and supply-demand modeling. Status: In Development.

EXPERIENCE:
- Software Engineering Intern at berulo Foundation (Mar 2025 – May 2025) — developed and tested software, optimised algorithms, participated in code reviews.

EDUCATION:
- BSc. Computer & Software Engineering — University of Rwanda (May 2022 – Present).
- A Level — GS APAPEC Murambi (2018 – 2021).

CERTIFICATIONS: Effective Presentations (HP LIFE), Strategies for Personal Growth (HP LIFE), Fundamental AI Concepts (Microsoft Learn), FabLab IoT Certification, Cybersecurity Essential Skills (A+), IoT LoRaWAN Specialization, Cisco Switching/Routing/Wireless Essentials.

CONTACT: tuyizerepacifique053@gmail.com | +250 789 215 493 | GitHub: Pacifique001 | LinkedIn: pacifique-tuyizere-39472772b
`

/* Simple keyword-matching responder — no external API needed */
function getAIResponse(question: string): string {
  const q = question.toLowerCase()

  if (q.includes("skill") || q.includes("technolog") || q.includes("stack") || q.includes("know")) {
    return "Pacifique is proficient in Java, Python, JavaScript/Node.js, C/C++, Dart, Kotlin, and PHP. On the framework side he works with Spring Boot, Django, Flask, Express.js, React Native, and Flutter. For cybersecurity he uses pfSense, Nessus, Burp Suite, and WAZUH SIEM. Databases include PostgreSQL, MySQL, MongoDB, and Redis, with Docker for containerisation."
  }

  if (q.includes("project") || q.includes("work") || q.includes("built") || q.includes("portfolio")) {
    return "There are three featured projects: (1) the Federated AIOps Framework for 5G-IoT Security — an AI-powered threat-detection system using federated learning, (2) MamaCare — an offline-first Flutter app for maternal healthcare in low-connectivity regions, and (3) an Agricultural Market Analytics Platform for modeling farmer revenue and supply-demand trends. All are currently in active development."
  }

  if (q.includes("contact") || q.includes("email") || q.includes("reach") || q.includes("hire")) {
    return "You can reach Pacifique at tuyizerepacifique053@gmail.com or call +250 789 215 493. He is also active on GitHub (@Pacifique001) and LinkedIn. Visit the Contact page for a quick form."
  }

  if (q.includes("experience") || q.includes("intern") || q.includes("job") || q.includes("career")) {
    return "Pacifique completed a Software Engineering internship at berulo Foundation (Mar–May 2025) in Kigali, where he designed and tested applications, optimised performance, and conducted code reviews."
  }

  if (q.includes("education") || q.includes("university") || q.includes("degree") || q.includes("study")) {
    return "He is pursuing a BSc in Computer & Software Engineering at the University of Rwanda (since May 2022). He completed his A Levels at GS APAPEC Murambi (2018–2021) in Mathematics, Computer Science, and Economics."
  }

  if (q.includes("cert") || q.includes("credential") || q.includes("certificate")) {
    return "Key certifications include: Cybersecurity Essential Skills (85/85 A+), IoT LoRaWAN Specialization, Cisco Switching/Routing/Wireless Essentials, Fundamental AI Concepts (Microsoft Learn), Effective Presentations (HP LIFE), and FabLab IoT Certification."
  }

  if (q.includes("recommend") || q.includes("suggest") || q.includes("which project") || q.includes("interest")) {
    return "Based on Pacifique's strongest focus areas, I would recommend exploring the Federated AIOps Framework if you are interested in AI and cybersecurity, or the MamaCare app if you care about mobile engineering and social-impact projects. The Agricultural Analytics Platform is a great example of data-driven full-stack development."
  }

  if (q.includes("cyber") || q.includes("security") || q.includes("hack") || q.includes("pentest")) {
    return "Pacifique has hands-on experience with pfSense firewalls, Nessus vulnerability scanning, Burp Suite web-app testing, WAZUH SIEM monitoring, VLAN segmentation, and penetration testing. His AIOps research project also applies AI to distributed network security."
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("greet")) {
    return "Hello! 👋 I'm Pacifique's AI assistant. I can tell you about his skills, projects, experience, education, certifications, or how to get in touch. What would you like to know?"
  }

  return "Great question! Pacifique is a Software & Network Engineer specialising in full-stack development, cybersecurity, and AI systems. Feel free to ask about his skills, projects, experience, education, or how to contact him — I'm happy to help!"
}

export default function AIChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Pacifique's AI assistant. Ask me anything about his skills, projects, experience, or how to get in touch.",
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, typing])

  const send = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTyping(true)

    // Simulate a short delay for realism
    setTimeout(() => {
      const reply = getAIResponse(text)
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
      setTyping(false)
    }, 600)
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg shadow-primary/25"
            >
              <Sparkles className="h-5 w-5" />
              <span className="sr-only">Open AI Assistant</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[520px] flex flex-col"
          >
            <Card className="flex flex-col h-[520px] shadow-2xl border-border/40">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Ask about Pacifique</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {["Skills", "Projects", "Experience", "Contact"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(`Tell me about Pacifique's ${q.toLowerCase()}`)
                        setTimeout(() => {
                          const text = `Tell me about Pacifique's ${q.toLowerCase()}`
                          const userMsg: Message = { role: "user", content: text }
                          setMessages((prev) => [...prev, userMsg])
                          setInput("")
                          setTyping(true)
                          setTimeout(() => {
                            const reply = getAIResponse(text)
                            setMessages((prev) => [...prev, { role: "assistant", content: reply }])
                            setTyping(false)
                          }, 600)
                        }, 50)
                      }}
                      className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t border-border/40">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask me anything..."
                    className="text-sm"
                  />
                  <Button size="icon" onClick={send} disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
