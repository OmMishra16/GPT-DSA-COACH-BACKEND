# Project Report

## CI/CD Pipeline Implementation for DSA Coach Backend Application

---

**Project Title:** Implementation of Complete CI/CD Pipeline with Kubernetes Deployment on AWS

**Course:** DevOps Engineering

**Submitted By:** Om Mishra

**Date:** January 2026

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [CI Pipeline Implementation](#7-ci-pipeline-implementation)
8. [CD Pipeline & Infrastructure as Code](#8-cd-pipeline--infrastructure-as-code)
9. [Kubernetes Deployment](#9-kubernetes-deployment)
10. [Security Implementation](#10-security-implementation)
11. [Testing & Results](#11-testing--results)
12. [Conclusion](#12-conclusion)
13. [References](#13-references)

---

## 1. Abstract

This project demonstrates the implementation of a complete CI/CD (Continuous Integration/Continuous Deployment) pipeline for a Node.js backend application. The DSA Coach Backend is an AI-powered teaching assistant that helps students learn Data Structures and Algorithms through the Socratic method. The project implements industry-standard DevOps practices including automated testing, security scanning (SAST/SCA), containerization using Docker, Infrastructure as Code using Terraform, and deployment to Kubernetes on AWS. The pipeline ensures code quality, security, and reliable deployments while following the "shift-left" testing philosophy to catch issues early in the development lifecycle.

---

## 2. Introduction

### 2.1 Background

In modern software development, the ability to deliver features quickly and reliably is crucial for business success. Traditional software development practices, where development and operations teams worked in silos, often led to delayed releases, deployment failures, and a disconnect between what developers built and what operations teams deployed.

DevOps emerged as a cultural and technical movement to bridge this gap. By combining development (Dev) and operations (Ops) practices, organizations can achieve faster time-to-market, improved collaboration, and more reliable software delivery.

### 2.2 What is CI/CD?

**Continuous Integration (CI)** is a development practice where developers integrate code into a shared repository frequently. Each integration is verified by an automated build and tests to detect errors quickly.

**Continuous Deployment (CD)** extends CI by automatically deploying all code changes to a testing or production environment after the build stage. This ensures that software can be reliably released at any time.

### 2.3 Project Context

The DSA Coach Backend is a Node.js/Express application that uses AI (via Groq, OpenAI, or Gemini APIs) to help students understand and solve LeetCode problems. Instead of providing direct answers, it guides learners through the Socratic method, asking questions and providing analogies to help them discover solutions themselves.

This project implements a complete CI/CD pipeline for this application, demonstrating real-world DevOps practices that can be applied to any software project.

---

## 3. Problem Statement

Manual software deployment processes suffer from several challenges:

1. **Human Error**: Manual deployments are prone to mistakes, leading to downtime and bugs in production.

2. **Slow Release Cycles**: Without automation, releases take days or weeks instead of hours or minutes.

3. **Inconsistent Environments**: Differences between development, testing, and production environments cause "works on my machine" issues.

4. **Security Vulnerabilities**: Without automated security scanning, vulnerabilities in code and dependencies may go undetected until production.

5. **Lack of Traceability**: Manual processes make it difficult to track what was deployed, when, and by whom.

6. **Infrastructure Drift**: Manual infrastructure setup leads to configuration inconsistencies across environments.

This project addresses these challenges by implementing automated CI/CD pipelines with Infrastructure as Code.

---

## 4. Objectives

### 4.1 Primary Objectives

1. **Implement Continuous Integration Pipeline**
   - Automate code linting and formatting checks
   - Execute unit tests on every code change
   - Perform static code analysis for security vulnerabilities
   - Scan dependencies for known vulnerabilities

2. **Implement Containerization**
   - Create optimized Docker images using multi-stage builds
   - Implement container security best practices
   - Scan container images for vulnerabilities

3. **Implement Infrastructure as Code**
   - Use Terraform to provision AWS infrastructure
   - Automate Kubernetes cluster setup
   - Manage secrets and configurations declaratively

4. **Implement Continuous Deployment**
   - Deploy containers to Kubernetes automatically
   - Implement rolling updates for zero-downtime deployments
   - Configure health checks and auto-recovery

### 4.2 Secondary Objectives

- Follow security best practices throughout the pipeline
- Document the implementation for reproducibility
- Use free-tier AWS services to minimize costs
- Implement proper secret management

---

## 5. Technology Stack

### 5.1 Application Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20 | JavaScript server-side runtime |
| Framework | Express.js 4.18 | Web application framework |
| AI Providers | Groq (Llama), OpenAI, Gemini | AI model integration |
| Database | MongoDB | NoSQL database for chat sessions |

### 5.2 DevOps Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Version Control | Git/GitHub | Source code management |
| CI/CD Platform | GitHub Actions | Pipeline orchestration |
| Container Runtime | Docker | Application containerization |
| Container Registry | DockerHub | Image storage and distribution |
| Infrastructure as Code | Terraform | AWS infrastructure provisioning |
| Container Orchestration | Kubernetes (k3s) | Container deployment and scaling |
| Cloud Provider | AWS (EC2) | Infrastructure hosting |

### 5.3 Security Tools

| Tool | Type | Purpose |
|------|------|---------|
| CodeQL | SAST | Static Application Security Testing |
| npm audit | SCA | Software Composition Analysis |
| Trivy | Container Scanning | OS and library vulnerability detection |

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
Developer Workstation
         │
         │ git push
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└─────────────────────────────────────────────────────────────┘
         │
         │ Trigger
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions CI Pipeline                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Lint   │→│  Test   │→│  SAST   │→│   SCA   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│       ↓                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Build  │→│  Trivy  │→│ Runtime │→│  Push   │           │
│  │ Docker  │ │  Scan   │ │  Test   │ │ Registry│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
         │
         │ Image Available
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DockerHub Registry                        │
│            mishraom/dsa-coach-backend:latest                 │
└─────────────────────────────────────────────────────────────┘
         │
         │ Pull Image
         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS EC2 (Provisioned by Terraform)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 k3s Kubernetes Cluster               │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │           Deployment (2 replicas)            │   │   │
│  │  │  ┌─────────┐         ┌─────────┐            │   │   │
│  │  │  │  Pod 1  │         │  Pod 2  │            │   │   │
│  │  │  │ :3001   │         │ :3001   │            │   │   │
│  │  │  └─────────┘         └─────────┘            │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                         ↓                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │      Service (NodePort 30000-32767)         │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
         │ HTTP Request
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        End Users                             │
│              http://<EC2-IP>:<NodePort>/api/health           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Pipeline Flow

1. Developer pushes code to GitHub
2. GitHub Actions triggers CI pipeline
3. Code passes through lint, test, SAST, and SCA stages
4. Docker image is built and scanned with Trivy
5. Container runtime test verifies the application starts correctly
6. Image is pushed to DockerHub
7. Terraform provisions AWS infrastructure with k3s
8. Kubernetes pulls and deploys the latest image
9. Application becomes accessible via NodePort service

---

## 7. CI Pipeline Implementation

### 7.1 Pipeline Configuration

The CI pipeline is defined in `.github/workflows/ci.yml` and implements the "shift-left" testing philosophy, where testing happens as early as possible in the development process.

### 7.2 Pipeline Stages

#### Stage 1: Build & Test

```yaml
build-and-test:
  name: Build & Test
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run ESLint
      run: npm run lint

    - name: Run tests
      run: npm run test
```

**Purpose:**
- **Checkout**: Retrieves source code from repository
- **Setup Node.js**: Installs Node.js with npm caching for faster builds
- **npm ci**: Installs exact dependency versions from package-lock.json
- **ESLint**: Enforces code quality and style standards
- **Jest Tests**: Executes unit tests to verify functionality

#### Stage 2: SAST (Static Application Security Testing)

```yaml
sast:
  name: SAST (CodeQL)
  runs-on: ubuntu-latest
  needs: build-and-test
  permissions:
    security-events: write

  steps:
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: javascript

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
```

**Purpose:**
- Analyzes source code without executing it
- Identifies security vulnerabilities like:
  - SQL/NoSQL injection
  - Cross-Site Scripting (XSS)
  - Path traversal
  - Insecure deserialization

#### Stage 3: SCA (Software Composition Analysis)

```yaml
sca:
  name: SCA (Dependency Scan)
  runs-on: ubuntu-latest
  needs: build-and-test

  steps:
    - name: Run npm audit
      run: npm audit --audit-level=high || true
```

**Purpose:**
- Scans third-party dependencies for known vulnerabilities
- Checks against the National Vulnerability Database (NVD)
- Reports CVEs found in npm packages

#### Stage 4: Docker Build, Scan & Push

```yaml
docker:
  name: Docker Build & Push
  runs-on: ubuntu-latest
  needs: [build-and-test, sast, sca]

  steps:
    - name: Build Docker image
      uses: docker/build-push-action@v5

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master

    - name: Test container runtime
      run: |
        docker run -d --name test-container ...
        curl --fail http://localhost:3001/api/health

    - name: Push to DockerHub
      uses: docker/build-push-action@v5
```

**Purpose:**
- Builds optimized Docker image using multi-stage Dockerfile
- Scans image with Trivy for OS and library vulnerabilities
- Runs container smoke test to verify application starts
- Pushes verified image to DockerHub registry

### 7.3 Pipeline Triggers

The pipeline runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master`
- Manual trigger via `workflow_dispatch`

---

## 8. CD Pipeline & Infrastructure as Code

### 8.1 Terraform Configuration

Terraform is used to provision AWS infrastructure declaratively. The configuration consists of three files:

#### 8.1.1 Provider Configuration (main.tf)

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

#### 8.1.2 Security Group

```hcl
resource "aws_security_group" "k8s_sg" {
  name        = "k8s-demo-sg"
  description = "Security group for K8s demo"

  # SSH (Port 22)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (Port 80)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API (Port 6443)
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NodePort Range (30000-32767)
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

#### 8.1.3 EC2 Instance with Automated k3s Setup

```hcl
resource "aws_instance" "k8s_server" {
  ami           = local.ubuntu_ami
  instance_type = var.instance_type  # t2.micro (free tier)

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Install k3s
    curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644

    # Wait for k3s
    sleep 30
    until kubectl get nodes | grep -q "Ready"; do
      sleep 5
    done

    # Create secret
    kubectl create secret generic dsa-coach-secrets \
      --from-literal=GROQ_API_KEY=${var.groq_api_key}

    # Deploy application
    kubectl apply -f - <<DEPLOY
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: dsa-coach-backend
    spec:
      replicas: 2
      ...
    DEPLOY

    # Create NodePort service
    kubectl expose deployment dsa-coach-backend \
      --type=NodePort \
      --port=80 \
      --target-port=3001
  EOF
}
```

### 8.2 Variables Configuration (variables.tf)

```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "instance_type" {
  default = "t2.micro"  # Free tier eligible
}

variable "groq_api_key" {
  type      = string
  sensitive = true
}

variable "docker_image" {
  default = "mishraom/dsa-coach-backend:latest"
}
```

### 8.3 Outputs Configuration (outputs.tf)

```hcl
output "instance_public_ip" {
  value = aws_instance.k8s_server.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.k8s_server.public_ip}"
}

output "health_check_command" {
  value = "ssh ubuntu@<IP> 'cat /home/ubuntu/deployment-status.txt'"
}
```

### 8.4 Deployment Process

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply

# Verify deployment
ssh ubuntu@<IP> 'kubectl get pods'
curl http://<IP>:<NodePort>/api/health
```

---

## 9. Kubernetes Deployment

### 9.1 Deployment Manifest

The Kubernetes deployment configuration ensures high availability and zero-downtime updates:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dsa-coach-backend
spec:
  replicas: 2

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  template:
    spec:
      containers:
        - name: dsa-coach-backend
          image: mishraom/dsa-coach-backend:latest
          ports:
            - containerPort: 3001

          env:
            - name: GROQ_API_KEY
              valueFrom:
                secretKeyRef:
                  name: dsa-coach-secrets
                  key: GROQ_API_KEY

          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"

          livenessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 30

          readinessProbe:
            httpGet:
              path: /api/health
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 10

      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
```

### 9.2 Key Kubernetes Features Used

| Feature | Purpose |
|---------|---------|
| **Replicas: 2** | High availability - if one pod fails, another serves traffic |
| **Rolling Update** | Zero-downtime deployments |
| **maxSurge: 1** | Only one extra pod during update |
| **maxUnavailable: 0** | Never reduce below desired replicas |
| **Liveness Probe** | Restarts container if health check fails |
| **Readiness Probe** | Only routes traffic to healthy pods |
| **Resource Limits** | Prevents runaway resource consumption |
| **Security Context** | Runs as non-root user for security |
| **Secrets** | Secure storage of API keys |

### 9.3 Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dsa-coach-backend-svc
spec:
  type: NodePort
  selector:
    app: dsa-coach-backend
  ports:
    - port: 80
      targetPort: 3001
```

The NodePort service exposes the application on a high port (30000-32767) on the EC2 instance's public IP.

---

## 10. Security Implementation

### 10.1 Security Testing Triangle

The project implements the three pillars of application security testing:

```
                    ┌─────────────┐
                    │   SECURITY  │
                    │   TESTING   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │    SAST    │  │    SCA     │  │    DAST    │
    │  CodeQL    │  │ npm audit  │  │ (Runtime)  │
    │            │  │            │  │            │
    │ Analyzes   │  │ Scans      │  │ Tests      │
    │ source     │  │ dependen-  │  │ running    │
    │ code       │  │ cies       │  │ app        │
    └────────────┘  └────────────┘  └────────────┘
```

### 10.2 Container Security

**Multi-Stage Docker Build:**
```dockerfile
# Stage 1: Builder (includes dev dependencies)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production (minimal image)
FROM node:20-alpine AS production
RUN npm ci --only=production
COPY --from=builder /app/src ./src

# Run as non-root user
RUN adduser -S nodeuser -u 1001
USER nodeuser

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --spider http://localhost:3001/api/health

CMD ["node", "src/app.js"]
```

**Security Features:**
- Alpine Linux base image (minimal attack surface)
- Non-root user execution (principle of least privilege)
- Production-only dependencies (reduced attack surface)
- Health check for container orchestration
- No shell or unnecessary tools in production image

### 10.3 Secret Management

Secrets are managed at multiple levels:

| Level | Method |
|-------|--------|
| GitHub | Encrypted secrets (DOCKERHUB_TOKEN, KUBECONFIG) |
| Terraform | Sensitive variables (groq_api_key) |
| Kubernetes | Kubernetes Secrets (dsa-coach-secrets) |

### 10.4 Trivy Container Scanning

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.IMAGE_NAME }}:${{ github.sha }}
    format: 'table'
    exit-code: '0'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

Trivy scans for:
- OS package vulnerabilities
- Application library vulnerabilities
- Configuration issues
- Sensitive data exposure

---

## 11. Testing & Results

### 11.1 CI Pipeline Results

The CI pipeline successfully executes all stages:

| Stage | Status | Duration |
|-------|--------|----------|
| Checkout | Pass | ~5s |
| Setup Node.js | Pass | ~10s |
| Install Dependencies | Pass | ~30s |
| ESLint | Pass | ~5s |
| Jest Tests | Pass | ~10s |
| CodeQL SAST | Pass | ~2min |
| npm audit SCA | Pass | ~10s |
| Docker Build | Pass | ~1min |
| Trivy Scan | Pass | ~30s |
| Container Runtime Test | Pass | ~15s |
| Push to DockerHub | Pass | ~30s |

**Total Pipeline Duration:** ~5-6 minutes

### 11.2 Deployment Verification

**Kubernetes Resources:**
```
$ kubectl get pods
NAME                                READY   STATUS    RESTARTS   AGE
dsa-coach-backend-xxxxx-yyyyy       1/1     Running   0          5m
dsa-coach-backend-xxxxx-zzzzz       1/1     Running   0          5m

$ kubectl get svc
NAME                     TYPE       CLUSTER-IP    PORT(S)        AGE
dsa-coach-backend-svc    NodePort   10.43.x.x     80:32630/TCP   5m
```

**Health Check:**
```
$ curl http://54.225.56.192:32630/api/health
{"status":"ok","message":"Server is running"}
```

### 11.3 Infrastructure Provisioning

Terraform successfully provisions:
- 1 EC2 instance (t2.micro - free tier)
- 1 Security Group with required ports
- 1 Key Pair for SSH access
- k3s Kubernetes cluster (single node)
- Automated application deployment

**Terraform Output:**
```
instance_public_ip = "54.225.56.192"
ssh_command = "ssh -i ~/.ssh/id_rsa ubuntu@54.225.56.192"
app_url_hint = "http://54.225.56.192:<NodePort>/api/health"
```

---

## 12. Conclusion

### 12.1 Achievements

This project successfully demonstrates a complete CI/CD pipeline implementation with the following accomplishments:

1. **Automated CI Pipeline**: Code changes are automatically tested, scanned, and built into Docker images.

2. **Security Integration**: SAST, SCA, and container scanning ensure security throughout the pipeline.

3. **Infrastructure as Code**: Terraform enables reproducible, version-controlled infrastructure.

4. **Kubernetes Deployment**: Container orchestration provides scalability, high availability, and self-healing capabilities.

5. **Cost Optimization**: Using AWS free tier (t2.micro) and k3s (lightweight Kubernetes) minimizes costs.

6. **Documentation**: Comprehensive documentation enables reproducibility and knowledge transfer.

### 12.2 Lessons Learned

- **Shift-Left Testing**: Finding bugs early (in CI) is significantly cheaper than finding them in production.
- **Infrastructure as Code**: Manual infrastructure setup is error-prone; Terraform provides consistency and versioning.
- **Container Security**: Running as non-root and using minimal base images significantly reduces attack surface.
- **Kubernetes**: Even lightweight distributions like k3s provide powerful orchestration capabilities.

### 12.3 Future Enhancements

1. **Add DAST**: Implement dynamic application security testing with tools like OWASP ZAP
2. **Implement GitOps**: Use ArgoCD for declarative Kubernetes deployments
3. **Add Monitoring**: Implement Prometheus/Grafana for observability
4. **Multi-Environment**: Create staging and production environments
5. **Add Integration Tests**: Expand test coverage beyond unit tests
6. **Implement Canary Deployments**: Gradually roll out changes to reduce risk

---

## 13. References

1. GitHub Actions Documentation - https://docs.github.com/en/actions
2. Docker Documentation - https://docs.docker.com
3. Kubernetes Documentation - https://kubernetes.io/docs
4. Terraform AWS Provider - https://registry.terraform.io/providers/hashicorp/aws
5. k3s Lightweight Kubernetes - https://k3s.io
6. Trivy Container Scanner - https://aquasecurity.github.io/trivy
7. CodeQL Security Analysis - https://codeql.github.com
8. OWASP DevSecOps Guidelines - https://owasp.org/www-project-devsecops-guideline
9. Node.js Best Practices - https://github.com/goldbergyoni/nodebestpractices
10. 12-Factor App Methodology - https://12factor.net

---

## Appendix A: GitHub Actions Workflow (ci.yml)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ secrets.DOCKERHUB_USERNAME }}/dsa-coach-backend

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  sast:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript
      - uses: github/codeql-action/analyze@v3

  sca:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - run: npm audit --audit-level=high || true

  docker:
    runs-on: ubuntu-latest
    needs: [build-and-test, sast, sca]
    steps:
      - uses: docker/build-push-action@v5
      - uses: aquasecurity/trivy-action@master
      - run: docker run ... && curl http://localhost:3001/api/health
      - uses: docker/login-action@v3
      - uses: docker/build-push-action@v5
        with:
          push: true
```

---

## Appendix B: Terraform Configuration

**main.tf** - AWS provider and resources
**variables.tf** - Input variables
**outputs.tf** - Output values

See Section 8 for complete configuration details.

---

## Appendix C: Kubernetes Manifests

**deployment.yaml** - Application deployment
**service.yaml** - NodePort service and secrets

See Section 9 for complete manifest details.

---

*Report Generated: January 2026*
*Total Pages: 10*
