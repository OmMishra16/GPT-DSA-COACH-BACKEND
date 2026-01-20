# Project Report

## CI/CD Pipeline for DSA Coach Backend

**Name:** Om Mishra
**Date:** January 2026

---

## 1. Problem Background & Motivation

I built a backend application called DSA Coach that helps students learn Data Structures and Algorithms. It uses AI to guide learners through problems using the Socratic method - asking questions instead of giving direct answers.

The app was working fine locally, but deploying it was painful. Every time I made a change, I had to manually run tests, build the Docker image, push it to DockerHub, SSH into my server, pull the image, and restart the container. This took 15-20 minutes and I'd often forget a step or make a typo somewhere.

I wanted to fix this by building a proper CI/CD pipeline. The goal was simple: push my code to GitHub and have everything else happen automatically - tests, security scans, Docker build, and deployment to Kubernetes.

---

## 2. Application Overview

DSA Coach Backend is a Node.js/Express API that connects to AI providers (Groq, OpenAI, Gemini) to help students understand coding problems.

**What it does:**
- Takes a LeetCode problem and student's question
- Uses AI to guide them with hints instead of solutions
- Stores chat history in MongoDB

**Tech Stack:**
- Node.js 20 + Express.js
- Groq API for AI responses
- MongoDB for storing sessions
- Docker for containerization

**Endpoints:**
- `GET /api/health` - health check
- `POST /api/chat` - chat with AI coach
- `GET /api/problems/:slug` - fetch problem details

---

## 3. CI/CD Architecture

Here's the complete flow of my pipeline:

```
Developer (me)
     |
     | git push to main
     v
GitHub Repository
     |
     | triggers automatically
     v
===========================================
           CI PIPELINE (ci.yml)
===========================================
     |
     +---> Build & Test Job
     |        +---> Checkout code
     |        +---> Setup Node.js 20
     |        +---> npm ci (install deps)
     |        +---> ESLint (code quality)
     |        +---> Jest (unit tests)
     |
     +---> SAST Job (needs build-and-test)
     |        +---> CodeQL Analysis
     |
     +---> SCA Job (needs build-and-test)
     |        +---> npm audit
     |
     +---> Docker Job (needs all above)
              +---> Build Docker image
              +---> Trivy vulnerability scan
              +---> Container runtime test
              +---> Push to DockerHub
     |
     | on success, triggers
     v
===========================================
           CD PIPELINE (cd.yml)
===========================================
     |
     +---> Deploy Job
     |        +---> SSH to EC2 (ubuntu@<EC2_HOST>)
     |        +---> Fix k3s permissions
     |        +---> kubectl rollout restart
     |        +---> Wait for rollout complete
     |        +---> Health check
     |
     +---> DAST Job (placeholder)
              +---> Would run OWASP ZAP
     |
     v
===========================================
        KUBERNETES (k3s on AWS EC2)
===========================================
     |
     +---> Deployment (2 replicas)
     |        +---> Pod 1 (dsa-coach-backend)
     |        +---> Pod 2 (dsa-coach-backend)
     |
     +---> Service (NodePort)
     |        +---> Port 80 -> 3001
     |        +---> NodePort 30000-32767
     |
     v
Users access: http://<EC2-IP>:<NodePort>/api/health
```

---

## 4. CI Pipeline Design & Stages

I designed my CI pipeline with a specific reason for each stage. The pipeline is in `.github/workflows/ci.yml`.

### Stage 1: Build & Test
**What it does:**
- Checks out code
- Sets up Node.js 20 with npm caching
- Runs `npm ci` for clean install
- Runs ESLint for code quality
- Runs Jest tests

**Why I added it:** This is the first gate. If code doesn't lint or tests fail, there's no point running expensive security scans or building Docker images. Fail fast.

### Stage 2: SAST (CodeQL)
**What it does:** GitHub's CodeQL analyzes my JavaScript code for security vulnerabilities.

**Why I added it:** Catches issues like:
- Injection attacks (SQL, NoSQL, command injection)
- XSS vulnerabilities
- Path traversal
- Hardcoded credentials

I chose CodeQL because it's free, built into GitHub, and results show in the Security tab.

### Stage 3: SCA (npm audit)
**What it does:** Scans all my npm dependencies against the National Vulnerability Database.

**Why I added it:** My app uses Express, Axios, MongoDB driver, and other packages. Any of these could have known CVEs. I want to know before I deploy, not after.

### Stage 4: Docker Build, Scan & Push
**What it does:**
1. Builds Docker image using multi-stage Dockerfile
2. Runs Trivy to scan for OS and library vulnerabilities
3. Spins up the container and hits `/api/health` to verify it works
4. If all passes, pushes to DockerHub with commit SHA tag

**Why I added it:** Even if my code is clean, the base image (node:20-alpine) could have vulnerabilities. Trivy catches those. The runtime test ensures the container actually starts - no point pushing a broken image.

---

## 5. CD Pipeline & Infrastructure

The CD pipeline is in `.github/workflows/cd.yml`. It triggers automatically when CI succeeds.

### How CD Works

The CD pipeline uses SSH to connect to my EC2 and restart the Kubernetes deployment:

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ubuntu
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      sudo chmod 644 /etc/rancher/k3s/k3s.yaml
      kubectl rollout restart deployment/dsa-coach-backend
      kubectl rollout status deployment/dsa-coach-backend --timeout=180s
```

### Why SSH Instead of kubectl from GitHub?
I tried using kubeconfig directly but k3s generates configs with `127.0.0.1` as the server address. Modifying it to use the public IP was complex. SSH is simpler - just connect and run kubectl locally on the server.

### Optional Terraform Job
The CD pipeline also has an optional Terraform job that only runs when I manually trigger it with a checkbox. This lets me:
- Provision new infrastructure from GitHub
- Recreate everything if something breaks

### Why Terraform?
I used Terraform to provision my AWS infrastructure. Manual setup through AWS console is error-prone. With Terraform, I run one command and get:
- EC2 instance (t2.medium - 2 vCPU, 4GB RAM)
- Security group with required ports (22, 80, 443, 6443, 30000-32767)
- SSH key pair
- k3s installed with `--disable traefik --disable metrics-server`
- My app deployed automatically

### Why t2.medium?
I originally tried t2.micro (free tier) but it couldn't handle k3s + 2 replicas. The load average hit 8+ on a single-core machine and kubectl commands kept timing out. Upgraded to t2.medium (2 vCPU, 4GB RAM) and everything runs smoothly now.

### Why k3s?
I chose k3s over full Kubernetes because:
- Lightweight - runs on a single EC2
- Still gives me deployments, services, secrets, rolling updates
- One curl command to install
- Good enough for this demo

I disabled traefik and metrics-server to reduce resource usage.

### DAST Placeholder
The CD pipeline includes a DAST job that's currently a placeholder. In production, this would run OWASP ZAP against the live application to test for runtime vulnerabilities.

---

## 6. Security & Quality Controls

### Shift-Left Security
I followed the shift-left principle - catch security issues early when they're cheap to fix.

| Stage | Tool | What It Catches |
|-------|------|-----------------|
| SAST | CodeQL | Code vulnerabilities (injection, XSS) |
| SCA | npm audit | Vulnerable dependencies |
| Container | Trivy | OS/library CVEs in Docker image |
| DAST | (Placeholder) | Runtime vulnerabilities |

### Container Security
My Dockerfile follows best practices:
```dockerfile
FROM node:20-alpine AS builder
# ... build stage

FROM node:20-alpine AS production
RUN adduser -S nodeuser -u 1001
USER nodeuser
HEALTHCHECK --interval=30s CMD wget --spider http://localhost:3001/api/health
```

- Multi-stage build (smaller image, less attack surface)
- Runs as non-root user (UID 1001)
- Only production dependencies
- Health check configured

### Secret Management
No secrets are hardcoded anywhere:

| Secret | Where Stored |
|--------|--------------|
| DOCKERHUB_USERNAME | GitHub Secrets |
| DOCKERHUB_TOKEN | GitHub Secrets |
| EC2_HOST | GitHub Secrets |
| EC2_SSH_KEY | GitHub Secrets |
| GROQ_API_KEY | Terraform variable (sensitive) → K8s Secret |

---

## 7. Results & Observations

### What Worked
- Full CI pipeline runs in ~5-6 minutes
- Push to main automatically deploys to Kubernetes
- Rolling updates mean zero downtime
- Terraform makes infrastructure reproducible
- t2.medium handles the workload easily (load ~0.1-0.2)

### CI Pipeline Results
| Stage | Status | Time |
|-------|--------|------|
| Build & Test | Pass | ~45s |
| SAST (CodeQL) | Pass | ~2min |
| SCA (npm audit) | Pass | ~15s |
| Docker Build | Pass | ~1min |
| Trivy Scan | Pass | ~30s |
| Runtime Test | Pass | ~15s |
| Push to DockerHub | Pass | ~30s |
| **Total CI** | Pass | ~5-6 min |

### CD Pipeline Results
| Stage | Status | Time |
|-------|--------|------|
| Deploy via SSH | Pass | ~20s |
| Health Check | Pass | ~10s |
| DAST (Placeholder) | Pass | ~3s |
| **Total CD** | Pass | ~30s |

### Challenges I Faced

1. **t2.micro was too small**
   - k3s + 2 replicas overloaded 1GB RAM
   - Load average hit 8+ on single core
   - kubectl commands kept timing out
   - Fixed by upgrading to t2.medium

2. **k3s permission issues**
   - kubeconfig at `/etc/rancher/k3s/k3s.yaml` had wrong permissions after restart
   - Fixed by adding `sudo chmod 644` in CD script

3. **SSH timeouts in CD**
   - Sometimes k3s API wouldn't respond immediately
   - Added retry logic and k3s restart handling in the deploy script

4. **Kubeconfig localhost issue**
   - k3s generates kubeconfig with `127.0.0.1` as server
   - Couldn't use it from GitHub Actions
   - Solved by using SSH approach instead

### What I Learned
- Always check resource requirements before choosing instance size
- Infrastructure as Code saves hours of debugging
- Shift-left testing catches issues when they're cheap to fix
- SSH-based deployment is simpler than trying to expose k8s API

---

## 8. Limitations & Future Improvements

### Current Limitations
- No staging environment (deploys directly to production)
- DAST is just a placeholder
- Single node k3s - no real high availability
- Manual secret rotation
- EC2 IP changes on recreate (need to update GitHub secret)

### What I'd Add Next
1. **OWASP ZAP for DAST** - Actually scan the running app
2. **ArgoCD for GitOps** - Declarative deployments instead of SSH
3. **Prometheus/Grafana** - Monitoring and alerting
4. **Staging environment** - Test before production
5. **Elastic IP** - So EC2 IP doesn't change

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
# Update EC2_HOST GitHub secret with new IP
```

### GitHub Secrets Required
| Secret | Purpose |
|--------|---------|
| DOCKERHUB_USERNAME | DockerHub login |
| DOCKERHUB_TOKEN | DockerHub access token |
| EC2_HOST | EC2 public IP |
| EC2_SSH_KEY | Private SSH key content |

### Destroy Infrastructure (Save Costs)
```bash
cd terraform
terraform destroy -var="groq_api_key=your-key"
```

---

## 10. Conclusion

I built a complete CI/CD pipeline that takes my code from git push to production automatically. The pipeline runs security scans (SAST, SCA, container scanning), tests, builds Docker images, and deploys to Kubernetes on AWS.

The main takeaway was understanding why each stage exists. It's not about having the most stages - it's about catching the right issues at the right time:
- Linting catches code quality issues
- Tests catch bugs
- SAST catches code vulnerabilities
- SCA catches dependency vulnerabilities
- Trivy catches container vulnerabilities
- Runtime test catches startup issues

The project also taught me practical lessons about resource sizing (t2.micro vs t2.medium), permission issues (k3s kubeconfig), and choosing the right deployment approach (SSH over kubeconfig).

---

## References

1. GitHub Actions - https://docs.github.com/en/actions
2. Docker - https://docs.docker.com
3. Kubernetes - https://kubernetes.io/docs
4. Terraform AWS Provider - https://registry.terraform.io/providers/hashicorp/aws
5. k3s - https://k3s.io
6. Trivy - https://aquasecurity.github.io/trivy
7. CodeQL - https://codeql.github.com
8. appleboy/ssh-action - https://github.com/appleboy/ssh-action
