output "instance_public_ip" {
  description = "Public IP of K8s server"
  value       = aws_instance.k8s_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of K8s server"
  value       = aws_instance.k8s_server.public_dns
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.k8s_server.public_ip}"
}

output "app_url_hint" {
  description = "App URL (NodePort will be assigned dynamically, check with kubectl get svc)"
  value       = "http://${aws_instance.k8s_server.public_ip}:<NodePort>/api/health - Run 'kubectl get svc' on server to get NodePort"
}

output "health_check_command" {
  description = "Command to check health after deployment"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.k8s_server.public_ip} 'cat /home/ubuntu/deployment-status.txt'"
}
