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

  runtime_env_file = <<-EOT
    # Database (SQLite — file persisted via Docker volume)
    DATABASE_URL="file:${local.ec2_app_path}/data/database.db"

    # ECR Configuration
    ECR_REGISTRY="${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    ECR_SERVER_REPO="${var.ecr_server_repo}"

    # App URL (for Better Auth, callbacks, etc.)
    APP_URL="https://${var.website_domain}"

    # Application Secrets
    SESSION_SECRET="${var.session_secret}"
    COOKIE_SECRET="${var.cookie_secret}"

    # S3 Configuration (capture assets / screenshots)
    S3_ASSETS_BUCKET="${local.s3_assets_bucket_name}"
    AWS_REGION="${var.aws_region}"

    # Node Environment
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

  subnet_id                   = aws_subnet.public[0].id
  # SSH security group only attached when local_ip is set — prevents open SSH to 0.0.0.0/0
  vpc_security_group_ids = var.local_ip != "" ? [
    aws_security_group.allow_web_traffic.id,
    aws_security_group.allow_ssh_access.id,
  ] : [aws_security_group.allow_web_traffic.id]
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  key_name             = var.ec2_key_pair_name != "" ? var.ec2_key_pair_name : null

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
      cat > ${local.ec2_app_path}/.env <<'ENVEOF'
      ${local.runtime_env_file}
      ENVEOF
      chown ec2-user:ec2-user ${local.ec2_app_path}/.env
      chmod 600 ${local.ec2_app_path}/.env
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
        if [ -f ${local.ec2_app_path}/.env ] && [ -f ${local.ec2_app_path}/docker-compose.yml ] && [ -f ${local.ec2_app_path}/start.sh ]; then
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
