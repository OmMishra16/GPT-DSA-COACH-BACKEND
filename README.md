# DSA Coach Backend

AI-powered Data Structures & Algorithms coaching assistant backend built with Node.js/Express.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Local Development](#local-development)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Security](#security)
- [API Endpoints](#api-endpoints)

---

## Overview

DSA Coach is an AI-powered teaching assistant that helps learners understand and solve LeetCode problems using the Socratic method. Instead of giving direct answers, it guides students to discover solutions through questions and real-world analogies.

### Tech Stack
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **AI Providers**: Groq (Llama), OpenAI, Gemini
- **Database**: MongoDB
- **Container**: Docker
- **Orchestration**: Kubernetes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                          │
├─────────────────────────────────────────────────────────────┤
│  GitHub Actions                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Lint    │→│ Test    │→│ SAST    │→│ SCA     │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│       ↓                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Build   │→│ Trivy   │→│ Test    │→│ Push    │          │
│  │ Docker  │ │ Scan    │ │ Runtime │ │ Registry│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Kubernetes Cluster                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Deployment (replicas: 2)                            │   │
│  │  ┌─────────┐  ┌─────────┐                           │   │
│  │  │  Pod 1  │  │  Pod 2  │  ← Rolling Updates        │   │
│  │  └─────────┘  └─────────┘                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Service (ClusterIP)                                 │   │
│  │  Port 80 → Container Port 3001                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### Setup

```bash
# Clone repository
git clone <repository-url>
cd GPT-DSA-COACH-BACKEND

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for Llama models | Yes (if using Groq) |
| `OPENAI_API_KEY` | OpenAI API key | No |
| `GEMINI_API_KEY` | Google Gemini API key | No |
| `DEFAULT_AI_PROVIDER` | Default AI provider (groq/openai/gemini) | No (default: groq) |
| `MONGODB_URI` | MongoDB connection string | No |
| `PORT` | Server port | No (default: 3001) |

### Scripts

```bash
npm start      # Start production server
npm run dev    # Start with hot reload (nodemon)
npm run lint   # Run ESLint
npm run test   # Run Jest tests
```

---

## CI/CD Pipeline

### CI Pipeline (`.github/workflows/ci.yml`)

The CI pipeline implements **shift-left testing** - finding issues early where they're cheaper to fix.

| Stage | Tool | Purpose | VIVA Point |
|-------|------|---------|------------|
| Checkout | actions/checkout | Get source code | Ephemeral VMs need fresh code |
| Setup Node | actions/setup-node | Install runtime | Consistent environment + caching |
| Install | npm ci | Install dependencies | Deterministic builds (not npm install) |
| Lint | ESLint | Code quality | Catch issues before they become tech debt |
| Test | Jest | Unit tests | Regression prevention |
| SAST | CodeQL | Security analysis | Detects OWASP Top 10 vulnerabilities |
| SCA | npm audit | Dependency scan | Supply chain security |
| Docker Build | docker/build-push-action | Build image | Immutable artifact |
| Trivy Scan | aquasecurity/trivy | Container scan | OS-level vulnerabilities |
| Runtime Test | curl | Smoke test | Proves container actually runs |
| Push | docker/build-push-action | Push to registry | Only after all gates pass |

### CD Pipeline (`.github/workflows/cd.yml`)

| Stage | Purpose | VIVA Point |
|-------|---------|------------|
| Deploy to K8s | Apply manifests | Declarative deployment |
| DAST (Placeholder) | Runtime security | Completes security triangle |

### GitHub Secrets Required

| Secret | How to Get |
|--------|------------|
| `DOCKERHUB_USERNAME` | Your DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub → Account Settings → Security → New Access Token |
| `KUBECONFIG` | Base64 encoded kubeconfig (`cat ~/.kube/config \| base64`) |

---

## Deployment

### Docker

```bash
# Build image
docker build -t dsa-coach-backend .

# Run container
docker run -d -p 3001:3001 \
  -e GROQ_API_KEY=your-key \
  -e DEFAULT_AI_PROVIDER=groq \
  dsa-coach-backend

# Health check
curl http://localhost:3001/api/health
```

### Kubernetes (Minikube)

```bash
# Start Minikube
minikube start

# Create secret (replace with actual values)
kubectl create secret generic dsa-coach-secrets \
  --from-literal=GROQ_API_KEY=your-actual-key

# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services

# Access via port-forward
kubectl port-forward svc/dsa-coach-backend 8080:80
curl http://localhost:8080/api/health
```

---

## Security

### Security Testing Triangle

1. **SAST (Static Application Security Testing)** - CodeQL
   - Analyzes source code without executing
   - Finds injection vulnerabilities, XSS, etc.

2. **SCA (Software Composition Analysis)** - npm audit
   - Scans third-party dependencies
   - Identifies known CVEs in packages

3. **DAST (Dynamic Application Security Testing)** - Placeholder
   - Tests running application
   - Finds runtime vulnerabilities (auth bypass, CORS issues)

### Container Security

- **Multi-stage build**: Smaller attack surface
- **Non-root user**: Runs as user 1001, not root
- **Trivy scanning**: OS and library vulnerability detection
- **Health checks**: Ensures only healthy containers serve traffic

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | Chat with AI coach |
| GET | `/api/problems/:titleSlug` | Get LeetCode problem details |
| GET | `/api/chat/:sessionId` | Get chat history |

### Example Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me understand the two sum problem",
    "sessionId": "test-session"
  }'
```

---

## Project Structure

```
GPT-DSA-COACH-BACKEND/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI pipeline
│       └── cd.yml          # CD pipeline
├── k8s/
│   ├── deployment.yaml     # K8s deployment manifest
│   └── service.yaml        # K8s service + secret
├── src/
│   ├── app.js              # Express app entry point
│   ├── controllers/        # Route handlers
│   ├── services/           # Business logic (AI providers)
│   ├── middleware/         # Express middleware
│   └── models/             # MongoDB models
├── tests/
│   └── health.test.js      # Jest tests
├── Dockerfile              # Multi-stage Docker build
├── .dockerignore           # Docker build exclusions
├── eslint.config.js        # ESLint configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## License

MIT
