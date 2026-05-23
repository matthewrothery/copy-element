output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "ec2_public_ip" {
  description = "EC2 public IP address"
  value       = aws_eip.ec2.public_ip
}

output "ec2_ssh_command" {
  description = "SSH command to connect to EC2 instance"
  value       = var.ec2_key_pair_name != "" ? "ssh -i ~/.ssh/${var.ec2_key_pair_name}.pem ec2-user@${aws_eip.ec2.public_ip}" : "SSH key not configured"
}

/*
  RDS outputs disabled — re-enable with RDS.

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.database.address
  sensitive   = true
}

output "database_port" {
  description = "RDS database port"
  value       = aws_db_instance.database.port
}
*/

output "website_url" {
  description = "Website URL"
  value       = "https://${var.website_domain}"
}

output "cloudfront_website_distribution_id" {
  description = "CloudFront distribution ID for website"
  value       = aws_cloudfront_distribution.website.id
}


output "s3_website_bucket" {
  description = "S3 bucket name for website"
  value       = aws_s3_bucket.website.bucket
}

output "s3_assets_bucket" {
  description = "S3 bucket name for capture assets (screenshots, etc.)"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_auto_blog_bucket" {
  description = "S3 bucket name for auto-blog generated content artifacts"
  value       = aws_s3_bucket.auto_blog.bucket
}

output "ecr_server_repo_url" {
  description = "ECR repository URL for server"
  value       = aws_ecr_repository.server.repository_url
}

output "ecr_mcp_repo_url" {
  description = "ECR repository URL for MCP server"
  value       = aws_ecr_repository.mcp.repository_url
}

output "ecr_auto_blogger_repo_url" {
  description = "ECR repository URL for auto-blogger service"
  value       = aws_ecr_repository.auto_blogger.repository_url
}

output "mcp_url" {
  description = "MCP server URL"
  value       = "https://${var.mcp_subdomain}.${var.hosted_zone}"
}

output "github_actions_user_name" {
  description = "GitHub Actions IAM user name"
  value       = aws_iam_user.github_actions_deployer.name
}

output "ses_transactional_config_set_name" {
  description = "SES configuration set name for transactional email"
  value       = aws_sesv2_configuration_set.transactional.configuration_set_name
}

output "ses_marketing_config_set_name" {
  description = "SES configuration set name for marketing email"
  value       = aws_sesv2_configuration_set.marketing.configuration_set_name
}

output "ses_bounce_topic_arn" {
  description = "SNS topic ARN for SES bounce notifications"
  value       = aws_sns_topic.ses_bounces.arn
}

output "ses_complaint_topic_arn" {
  description = "SNS topic ARN for SES complaint notifications"
  value       = aws_sns_topic.ses_complaints.arn
}

output "auto_blogger_topics_lambda_name" {
  description = "Name of the auto-blogger topics Lambda function"
  value       = var.enable_auto_blogger_lambdas ? aws_lambda_function.auto_blogger_topics[0].function_name : null
}

output "auto_blogger_news_lambda_name" {
  description = "Name of the auto-blogger news Lambda function"
  value       = var.enable_auto_blogger_lambdas ? aws_lambda_function.auto_blogger_news[0].function_name : null
}

output "auto_blogger_state_table_name" {
  description = "DynamoDB table name for auto-blogger state"
  value       = aws_dynamodb_table.auto_blogger_state.name
}

output "deployment_instructions" {
  description = "Instructions for deploying applications"
  value       = <<-EOT
    To deploy:
    
    1. Build and push server image to ECR:
       - aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com
       - docker build -t ${aws_ecr_repository.server.repository_url}:latest ./server
       - docker push ${aws_ecr_repository.server.repository_url}:latest
    
    2. Apply Terraform to push config and run deployment on EC2 via SSM:
       - terraform apply -var-file=./variables/prod.tfvars
    
    Optional: manually re-run deploy on EC2 via SSM:
       - aws ssm send-command --instance-ids ${aws_instance.app.id} --document-name "AWS-RunShellScript" --parameters 'commands=["sudo -u ec2-user /home/ec2-user/element-armory/start.sh"]'
    
    3. Deploy website to S3 (if using static export):
       - aws s3 sync ./website/out s3://${aws_s3_bucket.website.bucket} --delete
       - aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.website.id} --paths "/*"
  EOT
}
