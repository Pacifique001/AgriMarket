export interface Testimonial {
  name: string
  role: string
  company: string
  image: string
  text: string
}

export const testimonials: Testimonial[] = [
  {
    name: "Jean-Pierre Habimana",
    role: "Senior Lecturer",
    company: "University of Rwanda",
    image: "/testimonials/placeholder1.png",
    text: "Pacifique is one of the most driven students I have supervised. His research on federated learning for 5G-IoT security showed a rare combination of theoretical depth and practical engineering skill.",
  },
  {
    name: "Alice Uwimana",
    role: "Program Manager",
    company: "FabLab Rwanda",
    image: "/testimonials/placeholder2.png",
    text: "During the IoT certification programme, Pacifique stood out for his ability to quickly prototype hardware-software solutions and mentor fellow participants through complex problems.",
  },
  {
    name: "David Nkurunziza",
    role: "CTO",
    company: "berulo Foundation",
    image: "/testimonials/placeholder3.png",
    text: "Pacifique brought energy and precision to our engineering team. He consistently delivered clean, well-tested code and proactively identified performance bottlenecks before they reached production.",
  },
  {
    name: "Grace Mutoni",
    role: "Full-Stack Developer",
    company: "Kigali Tech Hub",
    image: "/testimonials/placeholder4.png",
    text: "Collaborating with Pacifique on a cross-team project was seamless. He communicates technical concepts clearly, adapts quickly to new stacks, and always keeps the end-user experience in focus.",
  },
]
