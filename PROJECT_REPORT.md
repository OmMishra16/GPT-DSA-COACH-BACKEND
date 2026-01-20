# Project Report

## CI/CD Pipeline for DSA Coach Backend

**Name:** Om Mishra
**Date:** January 2026

---

## 1. Problem Background & Motivation

I built a backend application called DSA Coach that helps students learn Data Structures and Algorithms. It uses AI to guide learners through problems using the Socratic method - asking questions instead of giving direct answers.

The app was working fine locally, but deploying it was a pain. Every time I made a change, I had to manually run tests, build the Docker image, push it to DockerHub, SSH into my server, pull the image, and restart the container. This took 15-20 minutes and I'd often forget a step or make a typo somewhere.

I wanted to fix this by building a proper CI/CD pipeline. The goal was simple: push my code to GitHub and have everything else happen automatically - tests, security scans, Docker build, and deployment to Kubernetes.

---

## 2. Application Overview

DSA Coach Backend is a Node.js/Express API that connects to AI providers (Groq, OpenAI, Gemini) to help students understand coding problems. Here's what it does:

- Takes a LeetCode problem and student's question
- Uses AI to guide them with hints instead of solutions
- Stores chat history in MongoDB

**Tech Stack:**
- Node.js 20 + Express.js
- Groq API for AI responses
- MongoDB for storing sessions
- Docker for containerization

The app exposes a few endpoints:
- `GET /api/health` - health check
- `POST /api/chat` - chat with AI coach
- `GET /api/problems/:slug` - fetch problem details

---

## 3. CI/CD Architecture

Here's how my pipeline works:

```
Developer (me)
     |
     | git push
     v
GitHub Repository
     |
     | triggers
     v
CI Pipeline (GitHub Actions)
     |
     +---> Lint (ESLint)
     +---> Test (Jest)
     +---> SAST (CodeQL)
     +---> SCA (npm audit)
     +---> Docker Build
     +---> Trivy Scan
     +---> Container Test
     +---> Push to DockerHub
     |
     v
CD Pipeline
     |
     +---> SSH to EC2
     +---> kubectl rollout restart
     |
     v
Kubernetes (k3s on AWS)
     |
     +---> 2 Pod replicas
     +---> NodePort Service
     |
     v
Users access via http://<EC2-IP>:<NodePort>/api/health
```

---

## 4. CI Pipeline Design & Stages

I designed my CI pipeline with a specific reason for each stage. Here's why each one matters:

### Stage 1: Lint (ESLint)
**Why I added it:** Catches sloppy code before it becomes a problem. Missing semicolons, unused variables, inconsistent formatting - these things pile up and make code hard to maintain. ESLint forces me to keep things clean.

### Stage 2: Unit Tests (Jest)
**Why I added it:** I have tests for the health endpoint and basic API functionality. If someone breaks something, tests catch it immediately. The pipeline fails fast so I don't waste time on broken code.

### Stage 3: SAST - CodeQL
**Why I added it:** This is GitHub's own security scanner. It analyzes my JavaScript code for vulnerabilities like:
- SQL/NoSQL injection
- XSS attacks
- Path traversal
- Hardcoded secrets

I chose CodeQL because it's free, integrates directly with GitHub, and shows findings in the Security tab.

### Stage 4: SCA - npm audit
**Why I added it:** My app has dependencies like Express, Axios, MongoDB driver, etc. These packages can have known vulnerabilities. npm audit checks them against the National Vulnerability Database. If a dependency has a critical CVE, I want to know before deploying.

### Stage 5: Docker Build
**Why I added it:** I use a multi-stage Dockerfile to keep the image small. Stage 1 installs everything, Stage 2 only copies what's needed for production. This reduces attack surface and speeds up pulls.

### Stage 6: Trivy Scan
**Why I added it:** Even if my code is secure, the base image (node:20-alpine) might have vulnerable packages. Trivy scans the entire container - OS packages and libraries - and flags critical/high vulnerabilities.

### Stage 7: Container Runtime Test
**Why I added it:** Before pushing to DockerHub, I spin up the container and hit the health endpoint. If the app doesn't start properly, this catches it. No point pushing a broken image.

### Stage 8: Push to DockerHub
**Why I added it:** Only happens if everything above passes. Tags the image with the commit SHA and `latest`. This gives me traceability - I can always find which commit produced which image.

---

## 5. CD Pipeline & Infrastructure

### Why Terraform?
I used Terraform to provision my AWS infrastructure. Manual setup through AWS console is error-prone and hard to replicate. With Terraform, I run one command and get:
- EC2 instance (t2.medium)
- Security group with the right ports
- SSH key pair
- k3s installed and configured
- My app deployed automatically

If I mess something up, I can destroy everything and recreate it in 5 minutes.

### Why k3s?
I chose k3s over full Kubernetes because:
- It's lightweight (runs on a single EC2)
- Still gives me deployments, services, secrets
- Easy to install with one curl command
- Good enough for this demo

### CD Workflow
When CI passes, the CD pipeline:
1. SSHs into my EC2
2. Runs `kubectl rollout restart deployment/dsa-coach-backend`
3. Kubernetes pulls the latest image from DockerHub
4. Does a rolling update (zero downtime)

I store the EC2 IP and SSH key as GitHub Secrets.

---

## 6. Security & Quality Controls

### Security Approach
I followed the shift-left principle - catch security issues early in the pipeline rather than in production.

**SAST (CodeQL):** Scans my source code for vulnerabilities without running it. Found 0 critical issues in my codebase.

**SCA (npm audit):** Checks dependencies. I had a few moderate vulnerabilities in dev dependencies which I accepted since they don't ship to production.

**Container Scanning (Trivy):** Scans the final Docker image. Alpine base image is minimal so there's less to go wrong.

### Container Security
My Dockerfile follows best practices:
- Multi-stage build (smaller image)
- Runs as non-root user (user ID 1001)
- Only production dependencies installed
- Health check configured

### Secret Management
- GitHub Secrets: DockerHub credentials, SSH key, EC2 host
- Terraform variables: Marked sensitive, passed at runtime
- Kubernetes Secrets: GROQ_API_KEY injected as environment variable

No secrets are hardcoded anywhere.

---

## 7. Results & Observations

### What Worked
- Full pipeline runs in about 5-6 minutes
- Push to main automatically deploys to Kubernetes
- Rolling updates mean zero downtime
- Terraform makes infrastructure reproducible

### CI Pipeline Results
| Stage | Status | Time |
|-------|--------|------|
| Lint | Pass | ~5s |
| Test | Pass | ~10s |
| CodeQL | Pass | ~2min |
| npm audit | Pass | ~10s |
| Docker Build | Pass | ~1min |
| Trivy | Pass | ~30s |
| Runtime Test | Pass | ~15s |
| Push | Pass | ~30s |

### Challenges I Faced
1. **t2.micro was too small** - k3s + 2 replicas overloaded 1GB RAM. Had to upgrade to t2.medium.

2. **k3s permission issues** - kubeconfig had wrong permissions after restart. Fixed by adding `chmod 644` in the CD script.

3. **SSH timeouts** - Sometimes k3s API wouldn't respond. Added retry logic and restart handling.

### What I Learned
- Always check resource requirements before choosing instance size
- Infrastructure as Code saves hours of debugging
- Shift-left testing catches issues when they're cheap to fix
- Kubernetes is overkill for small apps but teaches important concepts

---

## 8. Limitations & Future Improvements

### Current Limitations
- No staging environment (deploys directly to production)
- DAST is just a placeholder, not actually running security tests against live app
- Single node k3s - no real high availability
- Manual secret rotation

### What I'd Add Next
1. **OWASP ZAP for DAST** - Actually scan the running application for vulnerabilities
2. **ArgoCD for GitOps** - Declarative deployments instead of SSH
3. **Prometheus/Grafana** - Monitoring and alerting
4. **Staging environment** - Test before production
5. **Automated secret rotation** - Better security hygiene

---

## 9. How to Run This Project

### Local Development
```bash
git clone https://github.com/OmMishra16/GPT-DSA-COACH-BACKEND.git
cd GPT-DSA-COACH-BACKEND
npm install
cp .env.example .env  # add your API keys
npm run dev
```

### Deploy Infrastructure
```bash
cd terraform
terraform init
terraform apply -var="groq_api_key=your-key"
# Note the EC2 IP from output
```

### GitHub Secrets Required
| Secret | Purpose |
|--------|---------|
| DOCKERHUB_USERNAME | DockerHub login |
| DOCKERHUB_TOKEN | DockerHub access token |
| EC2_HOST | EC2 public IP |
| EC2_SSH_KEY | Private SSH key |

---

## 10. Conclusion

I built a complete CI/CD pipeline that takes my code from git push to production automatically. The pipeline runs security scans (SAST, SCA, container scanning), tests, builds Docker images, and deploys to Kubernetes.

The main takeaway for me was understanding why each stage exists. It's not about having the most stages - it's about catching the right issues at the right time. Linting catches code quality issues, tests catch bugs, security scans catch vulnerabilities, and container tests catch runtime issues. Each one serves a purpose.

The project also taught me that DevOps is about automation and reliability, not just tools. I can now push code confidently knowing that if something is wrong, the pipeline will catch it before it reaches users.

---

## References

1. GitHub Actions - https://docs.github.com/en/actions
2. Docker - https://docs.docker.com
3. Kubernetes - https://kubernetes.io/docs
4. Terraform AWS - https://registry.terraform.io/providers/hashicorp/aws
5. k3s - https://k3s.io
6. Trivy - https://aquasecurity.github.io/trivy
7. CodeQL - https://codeql.github.com
