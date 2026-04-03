# EC2 Instance Role
resource "aws_iam_role" "ec2_instance_role" {
  name = "${var.project}-${local.normalized_env}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-ec2-role"
    Environment = var.environment
  }
}

# Policy for EC2 to pull from ECR
resource "aws_iam_role_policy" "ec2_ecr_pull" {
  name = "${var.project}-${local.normalized_env}-ecr-pull"
  role = aws_iam_role.ec2_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# Policy for EC2 to access S3 assets bucket
resource "aws_iam_role_policy" "ec2_s3_assets" {
  name = "${var.project}-${local.normalized_env}-s3-assets"
  role = aws_iam_role.ec2_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.assets.arn,
          "${aws_s3_bucket.assets.arn}/*"
        ]
      }
    ]
  })
}

# Policy for EC2 to write CloudWatch Logs
resource "aws_iam_role_policy" "ec2_cloudwatch_logs" {
  name = "${var.project}-${local.normalized_env}-cloudwatch-logs"
  role = aws_iam_role.ec2_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
      }
    ]
  })
}

# Policy for EC2 to use SSM
resource "aws_iam_role_policy" "ec2_ssm" {
  name = "${var.project}-${local.normalized_env}-ssm"
  role = aws_iam_role.ec2_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_managed" {
  role       = aws_iam_role.ec2_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-${local.normalized_env}-ec2-profile"
  role = aws_iam_role.ec2_instance_role.name
}

# GitHub Actions IAM User
resource "aws_iam_user" "github_actions_deployer" {
  name = "${var.project}-${var.environment}-github-deployer"
  path = "/"

  tags = {
    Name        = "${var.project}-${var.environment}-github-deployer"
    Environment = var.environment
    Purpose     = "GitHub Actions deployment"
  }
}

resource "aws_iam_policy" "github_actions_deployment" {
  name        = "${var.project}-${var.environment}-github-deployment-policy"
  path        = "/"
  description = "IAM policy for GitHub Actions to deploy website and admin SPA to S3/CloudFront and server to ECR/EC2"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:GetObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*",
          aws_s3_bucket.admin.arn,
          "${aws_s3_bucket.admin.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations",
          "cloudfront:GetDistribution"
        ]
        Resource = [
          aws_cloudfront_distribution.website.arn,
          aws_cloudfront_distribution.admin.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:ListCommandInvocations",
          "ssm:GetCommandInvocation"
        ]
        Resource = [
          "arn:aws:ssm:*::document/AWS-RunShellScript",
          "arn:aws:ec2:${var.aws_region}:${local.account_id}:instance/*",
          "arn:aws:ssm:${var.aws_region}:${local.account_id}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-github-deployment-policy"
    Environment = var.environment
  }
}

resource "aws_iam_user_policy_attachment" "github_actions_deployment" {
  user       = aws_iam_user.github_actions_deployer.name
  policy_arn = aws_iam_policy.github_actions_deployment.arn
}
