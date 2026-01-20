# AWS Provider
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

# Ubuntu 22.04 LTS AMI for us-east-1
locals {
  ubuntu_ami = "ami-0c7217cdde317cfec"
}

# Security Group for K8s
resource "aws_security_group" "k8s_sg" {
  name        = "k8s-demo-sg"
  description = "Security group for K8s demo"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K8s API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NodePort range for K8s services
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # App port (for testing)
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "k8s-demo-sg"
  }
}

# Key Pair
resource "aws_key_pair" "k8s_key" {
  key_name   = "k8s-demo-key"
  public_key = file(var.public_key_path)
}

# EC2 Instance with k3s and auto-deploy
resource "aws_instance" "k8s_server" {
  ami           = local.ubuntu_ami
  instance_type = var.instance_type

  key_name               = aws_key_pair.k8s_key.key_name
  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Update system
              apt-get update
              apt-get install -y curl

              # Install k3s with minimal footprint (disable traefik, metrics-server)
              curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644 --disable traefik --disable metrics-server

              # Wait for k3s to be ready
              sleep 30

              # Wait for node to be ready
              until kubectl get nodes | grep -q "Ready"; do
                echo "Waiting for node to be ready..."
                sleep 5
              done

              # Create namespace secret for Groq API
              kubectl create secret generic dsa-coach-secrets \
                --from-literal=GROQ_API_KEY=${var.groq_api_key}

              # Create deployment
              cat <<DEPLOY | kubectl apply -f -
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: dsa-coach-backend
              spec:
                replicas: 2
                selector:
                  matchLabels:
                    app: dsa-coach-backend
                template:
                  metadata:
                    labels:
                      app: dsa-coach-backend
                  spec:
                    containers:
                      - name: dsa-coach-backend
                        image: ${var.docker_image}
                        ports:
                          - containerPort: 3001
                        env:
                          - name: NODE_ENV
                            value: "production"
                          - name: PORT
                            value: "3001"
                          - name: DEFAULT_AI_PROVIDER
                            value: "groq"
                          - name: GROQ_API_KEY
                            valueFrom:
                              secretKeyRef:
                                name: dsa-coach-secrets
                                key: GROQ_API_KEY
                        resources:
                          requests:
                            memory: "64Mi"
                            cpu: "50m"
                          limits:
                            memory: "128Mi"
                            cpu: "150m"
              DEPLOY

              # Wait for deployment to be ready
              kubectl rollout status deployment/dsa-coach-backend --timeout=120s

              # Create NodePort service
              kubectl expose deployment dsa-coach-backend \
                --type=NodePort \
                --port=80 \
                --target-port=3001 \
                --name=dsa-coach-backend-svc

              # Log completion
              echo "Deployment complete!" > /home/ubuntu/deployment-status.txt
              kubectl get pods >> /home/ubuntu/deployment-status.txt
              kubectl get svc >> /home/ubuntu/deployment-status.txt
              EOF

  tags = {
    Name = "k8s-demo-server"
  }
}
