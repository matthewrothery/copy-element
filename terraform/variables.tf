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

variable "app_domain" {
  description = "The app subdomain (e.g., app.elementarmory.com)"
  type        = string
}

variable "main_vpc_cidr" {
  description = "CIDR block for the main VPC"
  type        = string
  default     = "10.0.0.0/22"
}

# Database configuration
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

# ECR repository name
variable "ecr_server_repo" {
  description = "ECR repository name for the API/server"
  type        = string
  default     = "copy-element-server"
}

# S3 bucket names
variable "s3_website_bucket" {
  description = "S3 bucket name for website"
  type        = string
}

variable "s3_assets_bucket_base" {
  description = "Base name for assets bucket; actual bucket is {base}-{environment} (e.g. copy-element-assets-prod)"
  type        = string
  default     = "copy-element-assets"
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
