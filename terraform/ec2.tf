# Pinned to a specific Amazon Linux 2023 AMI (x86_64, us-east-2).
# Update image-id intentionally when you want to upgrade the base OS.
data "aws_ami" "amazon_linux_2023" {
  owners = ["amazon"]

  filter {
    name   = "image-id"
    values = ["ami-04b4a6abf17562d1a"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  ec2_app_path = "/home/ec2-user/element-armory"

  # Runtime env for the app (server) container.
  # Also used by start.sh for compose-level interpolation (ECR image tags, ECR login).
  server_env_file = <<-EOT
    # Database (SQLite — file persisted via bind mount)
    DATABASE_URL="file:${local.ec2_app_path}/data/database.db"

    # ECR — used by start.sh for docker login and compose image tag interpolation
    ECR_REGISTRY="${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    ECR_SERVER_REPO="${var.ecr_server_repo}"
    ECR_MCP_REPO="${var.ecr_mcp_repo}"
    ECR_AUTO_BLOGGER_REPO="${var.ecr_auto_blogger_repo}"

    # App URLs (Better Auth, callbacks, CORS)
    APP_URL="https://${var.website_domain}"
    FRONTEND_URL="https://${var.website_domain}"
    ADMIN_ORIGIN="https://${var.admin_subdomain}.${var.hosted_zone}"
    BETTER_AUTH_URL="https://${var.website_domain}/api/auth"

    # Auth secrets
    SESSION_SECRET="${var.session_secret}"
    COOKIE_SECRET="${var.cookie_secret}"
    GOOGLE_CLIENT_ID="${var.google_client_id}"
    GOOGLE_CLIENT_SECRET="${var.google_client_secret}"
    BETTER_AUTH_SECRET="${var.better_auth_secret}"

    # S3 (capture assets / screenshots) — names must match server ENV_KEYS (see server/src/constants)
    S3_BUCKET_CAPTURES="${local.s3_assets_bucket_name}"
    S3_REGION="${var.aws_region}"
    AWS_REGION="${var.aws_region}"
    AWS_SES_REGION="us-east-1"
    AUTO_BLOG_S3_BUCKET="${local.s3_auto_blog_bucket_name}"
    AUTO_BLOG_S3_PREFIX="auto-blogger"
    AUTO_BLOG_NOTIFY_TO="${var.auto_blog_notify_to}"
    AUTO_BLOG_NOTIFY_FROM="${var.from_email}"
    DAILY_ARTICLES="1"
    AUTO_BLOG_MODE="daemon"
    AUTO_BLOG_TARGET="topics"
    AUTO_BLOG_IMAGE_MODEL="gpt-image-2"
    AUTO_BLOG_IMAGE_STYLE="stencil"
    AUTO_BLOG_IMAGE_PALETTE="vibrant"
    OPENAI_API_KEY="${var.openai_api_key}"

    # Transactional email (AWS SES)
    FROM_EMAIL="${var.from_email}"
    SES_TRANSACTIONAL_CONFIG_SET="${aws_sesv2_configuration_set.transactional.configuration_set_name}"
    SES_MARKETING_CONFIG_SET="${aws_sesv2_configuration_set.marketing.configuration_set_name}"

    # Stripe billing
    STRIPE_SECRET_KEY="${var.stripe_secret_key}"
    STRIPE_WEBHOOK_SECRET="${var.stripe_webhook_secret}"
    STRIPE_PRICE_PRO_MONTHLY="${var.stripe_price_pro_monthly}"
    STRIPE_PRICE_PRO_YEARLY="${var.stripe_price_pro_yearly}"
    STRIPE_SUCCESS_URL="${var.stripe_success_url}"
    STRIPE_CANCEL_URL="${var.stripe_cancel_url}"
    STRIPE_PORTAL_RETURN_URL="${var.stripe_portal_return_url}"

    # Shared secret for server ↔ mcp-server calls
    INTERNAL_API_KEY="${var.internal_api_key}"

    # Admin users (comma-separated emails)
    ADMIN_EMAILS="${var.admin_emails}"

    NODE_ENV=production
  EOT

  # Runtime env for the mcp container only.
  mcp_env_file = <<-EOT
    # Shared secret for mcp-server → server calls
    INTERNAL_API_KEY="${var.internal_api_key}"

    # Anthropic (AI completions)
    ANTHROPIC_API_KEY="${var.anthropic_api_key}"

    NODE_ENV=production
  EOT

  docker_compose_prod = file("${path.module}/templates/docker-compose.prod.yml")
  nginx_conf          = file("${path.module}/templates/nginx.conf")
  start_script        = file("${path.module}/scripts/start.sh")
}

# Elastic IP for stable CloudFront origin
resource "aws_eip" "ec2" {
  domain = "vpc"

  tags = {
    Name        = "${var.project}-${var.environment}-eip"
    Environment = var.environment
  }
}

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.ec2_instance_type

  subnet_id = aws_subnet.public[0].id
  # SSH security group only attached when local_ip is set — prevents open SSH to 0.0.0.0/0
  vpc_security_group_ids = var.local_ip != "" ? [
    aws_security_group.allow_web_traffic.id,
    aws_security_group.allow_ssh_access.id,
  ] : [aws_security_group.allow_web_traffic.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  key_name             = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null

  # Allow Docker containers to use the instance profile via IMDSv2 (default hop limit 1 breaks this).
  metadata_options {
    http_put_response_hop_limit = 2
  }

  user_data = file("${path.module}/scripts/user-data.sh")

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
    encrypted   = true
  }

  tags = {
    Name        = "${var.project}-${var.environment}-app"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [user_data]
  }
}

resource "aws_eip_association" "ec2" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.ec2.id
}

resource "aws_ssm_association" "upload_runtime_env" {
  name             = "AWS-RunShellScript"
  association_name = "${var.project}-${var.environment}-upload-runtime-env"

  targets {
    key    = "InstanceIds"
    values = [aws_instance.app.id]
  }

  parameters = {
    commands = <<-EOC
      mkdir -p ${local.ec2_app_path}
      cat > ${local.ec2_app_path}/.env.server <<'SERVERENVEOF'
      ${local.server_env_file}
      SERVERENVEOF
      chown ec2-user:ec2-user ${local.ec2_app_path}/.env.server
      chmod 600 ${local.ec2_app_path}/.env.server
      cat > ${local.ec2_app_path}/.env.mcp <<'MCPENVEOF'
      ${local.mcp_env_file}
      MCPENVEOF
      chown ec2-user:ec2-user ${local.ec2_app_path}/.env.mcp
      chmod 600 ${local.ec2_app_path}/.env.mcp
    EOC
  }

  depends_on = [aws_instance.app, aws_iam_role_policy_attachment.ec2_ssm_managed]
}

resource "aws_ssm_association" "upload_runtime_config" {
  name             = "AWS-RunShellScript"
  association_name = "${var.project}-${var.environment}-upload-runtime-config"

  targets {
    key    = "InstanceIds"
    values = [aws_instance.app.id]
  }

  parameters = {
    commands = <<-EOC
      mkdir -p ${local.ec2_app_path}
      cat > ${local.ec2_app_path}/docker-compose.yml <<'COMPOSEEOF'
      ${local.docker_compose_prod}
      COMPOSEEOF
      cat > ${local.ec2_app_path}/nginx.conf <<'NGINXEOF'
      ${local.nginx_conf}
      NGINXEOF
      cat > ${local.ec2_app_path}/start.sh <<'STARTEOF'
      ${local.start_script}
      STARTEOF
      chmod +x ${local.ec2_app_path}/start.sh
      chown -R ec2-user:ec2-user ${local.ec2_app_path}
    EOC
  }

  depends_on = [aws_instance.app, aws_iam_role_policy_attachment.ec2_ssm_managed]
}

resource "aws_ssm_association" "run_deployment" {
  name             = "AWS-RunShellScript"
  association_name = "${var.project}-${var.environment}-run-deployment"

  targets {
    key    = "InstanceIds"
    values = [aws_instance.app.id]
  }

  parameters = {
    commands = <<-EOC
      for i in $(seq 1 30); do
        if [ -f ${local.ec2_app_path}/.env.server ] && [ -f ${local.ec2_app_path}/.env.mcp ] && [ -f ${local.ec2_app_path}/docker-compose.yml ] && [ -f ${local.ec2_app_path}/start.sh ]; then
          break
        fi
        sleep 2
      done
      sudo -u ec2-user ${local.ec2_app_path}/start.sh
    EOC
  }

  depends_on = [
    aws_ssm_association.upload_runtime_env,
    aws_ssm_association.upload_runtime_config
  ]
}
