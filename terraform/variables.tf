variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.medium" # 2 vCPU, 4GB RAM - supports k3s + 2 replicas
}

variable "public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "groq_api_key" {
  description = "Groq API Key for the application"
  type        = string
  sensitive   = true
  # Pass via: terraform apply -var="groq_api_key=your-key"
  # Or set TF_VAR_groq_api_key environment variable
  # Or via GitHub Actions secrets (GROQ_API_KEY)
}

variable "docker_image" {
  description = "Docker image to deploy"
  type        = string
  default     = "mishraom/dsa-coach-backend:latest"
}
