export interface BlogPost {
  slug: string
  title: string
  description: string
  content: string
  image: string
  category: string
  date: string
  readTime: string
  tags: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: "federated-learning-5g-iot-security",
    title: "How Federated Learning Can Secure 5G-IoT Networks",
    description:
      "Exploring decentralised AI techniques to detect anomalies in distributed IoT ecosystems without compromising data privacy.",
    content: `
## Introduction

The convergence of 5G and IoT has created networks with billions of endpoints, each one a potential attack surface. Traditional centralised security models struggle at this scale because they require shipping raw data to a single point — introducing latency, bandwidth costs, and serious privacy concerns.

Federated learning offers an alternative: train a shared model across many devices while keeping data local. In this post I walk through the core ideas behind my research project, the **Federated AIOps Framework**, and share lessons learned from early experiments.

---

## Why Centralised Approaches Fall Short

A typical security information and event management (SIEM) pipeline collects logs from every device, aggregates them, and runs detection algorithms centrally. For a smart-city deployment with hundreds of thousands of sensors this means:

- **Bandwidth bottlenecks** — continuous log streaming overwhelms backhaul links.
- **Single point of failure** — if the central node goes down, visibility drops to zero.
- **Privacy violations** — raw telemetry may contain personally identifiable information.

Federated learning sidesteps all three by training locally and exchanging only model updates.

---

## Architecture Overview

The framework follows a three-tier design:

1. **Edge layer** — lightweight anomaly detectors run on gateway devices using quantised neural networks.
2. **Fog layer** — regional aggregators merge model updates using Federated Averaging (FedAvg) and perform validation rounds.
3. **Cloud layer** — a global orchestrator coordinates training rounds, distributes the latest global model, and stores long-term threat intelligence.

Each tier communicates over gRPC with mutual TLS to prevent model-poisoning attacks.

---

## Early Results

On a simulated testbed of 500 heterogeneous IoT nodes, the federated approach achieved **94.3 % detection accuracy** on the UNSW-NB15 dataset, compared with 96.1 % for a fully centralised baseline — a modest trade-off for a **73 % reduction in data transmitted** to the aggregation layer.

---

## Key Takeaways

- Federated learning is not a silver bullet, but it is a practical path toward privacy-preserving security at scale.
- Model compression (quantisation, pruning) is essential for edge deployment on constrained hardware.
- Robust aggregation algorithms such as Krum or Trimmed Mean help defend against adversarial participants.

Stay tuned for future posts as the project matures. If you are working on similar problems, I would love to connect.
    `,
    image: "/blog/federated-learning.png",
    category: "Cybersecurity",
    date: "2025-05-10",
    readTime: "8 min read",
    tags: ["Federated Learning", "5G", "IoT", "AI Security"],
  },
  {
    slug: "building-offline-first-flutter-apps",
    title: "Building Offline-First Flutter Apps for Low-Connectivity Regions",
    description:
      "Practical patterns for data synchronisation, conflict resolution, and user experience when the network is unreliable.",
    content: `
## The Connectivity Challenge

In many parts of Sub-Saharan Africa, mobile data is expensive and coverage is patchy. For healthcare apps like **MamaCare**, an offline-first architecture is not a nice-to-have — it is the core design constraint.

---

## Offline-First Principles

1. **Local-first storage** — every write goes to a local SQLite database before any network call.
2. **Background sync** — a background isolate monitors connectivity and pushes pending changes when a connection is available.
3. **Conflict resolution** — last-write-wins with server timestamps, plus a manual review queue for critical clinical data.

---

## Implementation Highlights

### Drift (SQLite) for Local Persistence

\`\`\`dart
@DriftDatabase(tables: [Patients, Visits, SyncQueue])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 3;
}
\`\`\`

### Connectivity Monitoring

\`\`\`dart
final connectivityStream = Connectivity().onConnectivityChanged;

connectivityStream.listen((status) {
  if (status != ConnectivityResult.none) {
    SyncService.instance.pushPendingChanges();
  }
});
\`\`\`

---

## UX Considerations

- Always show a clear **sync status indicator** so health workers know whether they are working with the latest data.
- Use optimistic UI updates — the interface responds immediately and reconciles later.
- Queue non-critical uploads (images, attachments) separately so they do not block vital record sync.

---

## Lessons Learned

Building for unreliable networks forces you to think carefully about state management. The patterns I developed for MamaCare are applicable to any field-data-collection app — agriculture surveys, community health records, or logistics tracking.
    `,
    image: "/blog/offline-flutter.png",
    category: "Mobile Development",
    date: "2025-04-22",
    readTime: "6 min read",
    tags: ["Flutter", "Offline-First", "Mobile", "Dart"],
  },
  {
    slug: "pfsense-vlan-segmentation-guide",
    title: "Securing Campus Networks with pfSense and VLAN Segmentation",
    description:
      "A step-by-step walkthrough of designing a segmented network architecture using pfSense, VLANs, and firewall rules.",
    content: `
## Why Segment?

A flat network is a playground for lateral movement. Once an attacker compromises one device they can reach every other host. VLAN segmentation limits blast radius by isolating traffic into logical zones.

---

## Design Goals

- **Student VLAN** — internet access only, no access to admin services.
- **Staff VLAN** — access to internal portals and printers.
- **Server VLAN** — isolated backend services accessible only through defined firewall rules.
- **IoT VLAN** — cameras, sensors, and smart devices with heavily restricted egress.

---

## pfSense Configuration Highlights

### VLAN Interfaces

Create VLAN sub-interfaces on the LAN trunk port:

| VLAN ID | Name     | Subnet           |
|---------|----------|------------------|
| 10      | Students | 10.10.10.0/24    |
| 20      | Staff    | 10.10.20.0/24    |
| 30      | Servers  | 10.10.30.0/24    |
| 40      | IoT      | 10.10.40.0/24    |

### Firewall Rules

The key principle is **deny by default, allow explicitly**. For example, the IoT VLAN should only be allowed to reach the MQTT broker on port 1883 in the Server VLAN — nothing else.

---

## Monitoring with WAZUH

After deploying segmentation, I integrated WAZUH agents on critical servers to correlate firewall logs with endpoint telemetry. This provides visibility into any policy violations or anomalous cross-VLAN traffic.

---

## Results

After deployment, unauthorised lateral traffic dropped to near zero, and mean time to detect a simulated breach improved from 48 hours to under 2 hours.
    `,
    image: "/blog/pfsense-vlan.png",
    category: "Cybersecurity",
    date: "2025-03-15",
    readTime: "7 min read",
    tags: ["pfSense", "VLAN", "Network Security", "WAZUH"],
  },
  {
    slug: "spring-boot-rest-api-best-practices",
    title: "REST API Best Practices with Spring Boot and PostgreSQL",
    description:
      "Patterns for building clean, maintainable, and secure APIs — from project structure to authentication and error handling.",
    content: `
## Project Structure

I follow a **layered architecture** in all my Spring Boot projects:

\`\`\`
src/main/java/com/example/
├── controller/    # REST endpoints
├── service/       # Business logic
├── repository/    # Data access (JPA)
├── model/         # Entities & DTOs
├── config/        # Security, CORS, etc.
└── exception/     # Custom error handlers
\`\`\`

Keeping concerns separated makes the codebase easier to test and reason about.

---

## Authentication with Spring Security & JWT

\`\`\`java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
\`\`\`

---

## Global Error Handling

A single \`@RestControllerAdvice\` class maps exceptions to consistent JSON error responses with proper HTTP status codes:

\`\`\`java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
    return ResponseEntity.status(404)
        .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
}
\`\`\`

---

## Pagination & Filtering

Always expose paginated endpoints for list resources to avoid returning unbounded result sets:

\`\`\`
GET /api/projects?page=0&size=10&sort=createdAt,desc&category=AI
\`\`\`

---

## Key Takeaways

- Use DTOs to decouple your API contract from your database schema.
- Validate input at the controller level with \`@Valid\`.
- Write integration tests against a Testcontainers PostgreSQL instance.
- Document everything with SpringDoc / OpenAPI.
    `,
    image: "/blog/spring-boot-api.png",
    category: "Backend",
    date: "2025-02-28",
    readTime: "6 min read",
    tags: ["Spring Boot", "Java", "REST API", "PostgreSQL"],
  },
  {
    slug: "getting-started-with-docker-containers",
    title: "Getting Started with Docker: A Practical Guide for Students",
    description:
      "Everything I wish I knew when I first started containerising my applications — images, volumes, networks, and Compose.",
    content: `
## Why Docker?

"It works on my machine" is the bane of collaborative development. Docker solves this by packaging your application and all its dependencies into a portable container.

---

## Core Concepts

| Concept   | Analogy                        |
|-----------|-------------------------------|
| Image     | A recipe for your environment |
| Container | A running instance of a recipe|
| Volume    | A persistent USB drive        |
| Network   | A private LAN between containers |

---

## Your First Dockerfile

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

Build and run:

\`\`\`bash
docker build -t my-app .
docker run -p 3000:3000 my-app
\`\`\`

---

## Docker Compose for Multi-Service Apps

\`\`\`yaml
version: "3.9"
services:
  api:
    build: ./api
    ports:
      - "8080:8080"
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
\`\`\`

---

## Tips

- Use multi-stage builds to keep images small.
- Never run containers as root in production.
- Use \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, etc.
- Tag images with semantic versions, not just \`latest\`.

Docker transformed my workflow and I encourage every student to learn it early.
    `,
    image: "/blog/docker-guide.png",
    category: "DevOps",
    date: "2025-01-20",
    readTime: "5 min read",
    tags: ["Docker", "DevOps", "Containers", "Deployment"],
  },
  {
    slug: "ai-fundamentals-neural-networks",
    title: "Understanding Neural Networks: From Perceptrons to Deep Learning",
    description:
      "A beginner-friendly breakdown of how neural networks learn, with visual intuitions and Python code snippets.",
    content: `
## The Perceptron

A perceptron is the simplest neural network — a single neuron that takes weighted inputs, sums them, and passes the result through an activation function.

\`\`\`python
import numpy as np

def perceptron(x, w, b):
    return 1 if np.dot(x, w) + b > 0 else 0
\`\`\`

It can solve linearly separable problems (AND, OR) but fails on XOR — which is why we need **hidden layers**.

---

## Multi-Layer Networks

By stacking layers of neurons we gain the ability to learn non-linear decision boundaries. Each layer transforms its input and passes it forward:

\`\`\`
Input → Hidden Layer 1 → Hidden Layer 2 → Output
\`\`\`

---

## Backpropagation in a Nutshell

1. **Forward pass** — compute predictions.
2. **Loss calculation** — measure how wrong the predictions are.
3. **Backward pass** — compute gradients of the loss with respect to every weight.
4. **Update** — adjust weights in the direction that reduces the loss.

This cycle repeats for many epochs until the network converges.

---

## A Minimal Example with PyTorch

\`\`\`python
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(784, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
\`\`\`

---

## Where to Go Next

- **CNNs** for image recognition
- **RNNs / Transformers** for sequence data
- **Reinforcement Learning** for decision-making agents

Understanding the fundamentals makes every advanced topic approachable.
    `,
    image: "/blog/neural-networks.png",
    category: "AI & ML",
    date: "2024-12-05",
    readTime: "7 min read",
    tags: ["Neural Networks", "Deep Learning", "Python", "AI"],
  },
]

export const blogCategories = [
  "All",
  "Cybersecurity",
  "Mobile Development",
  "Backend",
  "DevOps",
  "AI & ML",
]
