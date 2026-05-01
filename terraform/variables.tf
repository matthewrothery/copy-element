variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "hosted_zone" {
  description = "The hosted zone domain name (e.g., elementarmory.com)"
  type        = string
}

variable "website_domain" {
  description = "The website domain name (e.g., elementarmory.com)"
  type        = string
}

variable "website_price_class" {
  description = "CloudFront price class for the marketing website distribution (PriceClass_100, PriceClass_200, or PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

variable "main_vpc_cidr" {
  description = "CIDR block for the main VPC"
  type        = string
  default     = "10.0.0.0/22"
}

/*
  Database variables disabled — re-enable with RDS.

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_instance_class" {
  description = "Database instance class (e.g., db.t4g.micro)"
  type        = string
}

variable "db_engine_type" {
  description = "Database engine type (e.g., postgresql)"
  type        = string
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_password" {
  description = "Database password (leave empty to auto-generate)"
  type        = string
  sensitive   = true
  default     = ""
}
*/

# EC2 configuration
variable "ec2_instance_type" {
  description = "EC2 instance type (e.g., t3.small). Must be x86_64 (t3) to match the AMI."
  type        = string
  default     = "t3.small"

  validation {
    condition     = !startswith(var.ec2_instance_type, "t4g.")
    error_message = "ec2_instance_type must be x86_64 (e.g. t3.small). t4g instances are arm64 and do not match the Amazon Linux 2023 x86_64 AMI."
  }
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = ""
}

# Application secrets
variable "session_secret" {
  description = "Session secret for app authentication"
  type        = string
  sensitive   = true
}

variable "cookie_secret" {
  description = "Cookie secret for session management"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth 2.0 client ID (Better Auth / sign-in with Google)"
  type        = string
  sensitive   = true
  default     = ""
}
variable "google_client_secret" {
  description = "Google OAuth 2.0 client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "better_auth_secret" {
  description = "Better Auth secret"
  type        = string
  sensitive   = true
  default     = ""
}


# ECR repository name
variable "ecr_server_repo" {
  description = "ECR repository name for the API/server"
  type        = string
  default     = "element-armory-server"
}

# S3 bucket names
variable "s3_website_bucket" {
  description = "S3 bucket name for website"
  type        = string
}

variable "s3_assets_bucket_base" {
  description = "Base name for assets bucket; actual bucket is {base}-{environment} (e.g. element-armory-assets-prod)"
  type        = string
  default     = "element-armory-assets"
}

variable "s3_auto_blog_bucket_base" {
  description = "Base name for auto-blog artifact bucket; actual bucket is {base}-{environment}"
  type        = string
  default     = "element-armory-auto-blog"
}

# Local IP for database access (optional)
variable "local_ip" {
  description = "Your local IP address for database access"
  type        = string
  default     = ""
}

# Google Search Console domain verification (TXT at apex)
variable "search_console_txt" {
  description = "TXT record value for Google Search Console domain verification. Leave empty to skip."
  type        = string
  default     = ""
}

# Gmail / Google Workspace domain verification (TXT at apex)
variable "gmail_txt" {
  description = "TXT record value for Gmail / Google Workspace domain verification. Leave empty to skip."
  type        = string
  default     = ""
}

variable "gmail_mx_priority" {
  description = "Priority for the Gmail MX record (e.g. 1)"
  type        = number
  default     = 1
}

variable "gmail_mx" {
  description = "MX exchange hostname for Gmail (e.g. SMTP.GOOGLE.COM). Leave empty to skip."
  type        = string
  default     = ""
}

variable "gmail_dkim_txt" {
  description = "TXT value for Google Workspace DKIM at google._domainkey (full v=DKIM1; ... line from Admin console). May be long (2048-bit key); split into ≤255-char Route 53 strings is automatic. Leave empty to skip."
  type        = string
  default     = ""
}

variable "mcp_subdomain" {
  description = "Subdomain for the MCP server (e.g. mcp → mcp.elementarmory.com)"
  type        = string
  default     = "mcp"
}

variable "ecr_mcp_repo" {
  description = "ECR repository name for the MCP server"
  type        = string
  default     = "element-armory-mcp"
}

variable "ecr_auto_blogger_repo" {
  description = "ECR repository name for the auto-blogger service"
  type        = string
  default     = "element-armory-auto-blogger"
}

variable "internal_api_key" {
  description = "Internal API key shared between app and mcp-server"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for the MCP server"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for auto-blogger text/image generation"
  type        = string
  sensitive   = true
  default     = ""
}

variable "admin_subdomain" {
  description = "Subdomain for the admin SPA (e.g. admin → admin.elementarmory.com)"
  type        = string
  default     = "admin"
}

variable "s3_admin_bucket" {
  description = "S3 bucket name for admin SPA"
  type        = string
}

# Stripe billing
variable "stripe_secret_key" {
  description = "Stripe secret key (sk_live_* or sk_test_*)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret (whsec_*)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_price_pro_monthly" {
  description = "Stripe Price ID for the Pro monthly plan"
  type        = string
  default     = ""
}

variable "stripe_price_pro_yearly" {
  description = "Stripe Price ID for the Pro yearly plan"
  type        = string
  default     = ""
}

variable "stripe_success_url" {
  description = "URL Stripe redirects to after a successful checkout"
  type        = string
  default     = ""
}

variable "stripe_cancel_url" {
  description = "URL Stripe redirects to when a checkout is cancelled"
  type        = string
  default     = ""
}

variable "stripe_portal_return_url" {
  description = "URL Stripe redirects to when leaving the billing portal"
  type        = string
  default     = ""
}

# Email (AWS SES)
variable "from_email" {
  description = "Verified SES sender address used for transactional email (e.g. noreply@elementarmory.com)"
  type        = string
  default     = ""
}

variable "ses_dmarc_policy" {
  description = "DMARC policy: none (monitor), quarantine, or reject. Start with none until reports confirm all senders are covered."
  type        = string
  default     = "none"
}

variable "ses_dmarc_rua" {
  description = "Email address for DMARC aggregate reports (e.g. dmarc-reports@elementarmory.com)"
  type        = string
  default     = ""
}

variable "admin_emails" {
  description = "Comma-separated email addresses to auto-promote to admin (e.g. you@example.com)"
  type        = string
  default     = ""
}

variable "auto_blog_notify_to" {
  description = "Email address that receives generated auto-blog article notifications"
  type        = string
  default     = ""
}
