# Auto-blogger Lambda functions, DynamoDB state table, EventBridge Scheduler,
# and supporting IAM. Gated by var.enable_auto_blogger_lambdas.
#
# Build the Lambda zip before applying with `enable_auto_blogger_lambdas = true`:
#   cd auto-blogger && npm run build:lambda
#
# GHA owns code updates via `aws lambda update-function-code` on push.
# Terraform owns config only — lifecycle.ignore_changes covers the code.

locals {
  lambda_zip_path     = "${path.module}/../auto-blogger/dist/lambda/lambda.zip"
  lambda_topics_name  = "${var.project}-${local.normalized_env}-auto-blogger-topics"
  lambda_news_name    = "${var.project}-${local.normalized_env}-auto-blogger-news"
  dynamodb_table_name = "${var.project}-${local.normalized_env}-auto-blogger-state"
}

# ─────────────────────────────────────────────────────────────────────────────
# DynamoDB state table (always created — no gate; cheap on-demand billing)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_dynamodb_table" "auto_blogger_state" {
  name         = local.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "pk"
  range_key = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = local.dynamodb_table_name
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM role for Lambda execution
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_auto_blogger" {
  name = "${var.project}-${local.normalized_env}-lambda-auto-blogger"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-lambda-auto-blogger"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "lambda_auto_blogger_dynamodb" {
  name = "${var.project}-${local.normalized_env}-lambda-ab-dynamodb"
  role = aws_iam_role.lambda_auto_blogger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = aws_dynamodb_table.auto_blogger_state.arn
    }]
  })
}

resource "aws_iam_role_policy" "lambda_auto_blogger_s3" {
  name = "${var.project}-${local.normalized_env}-lambda-ab-s3"
  role = aws_iam_role.lambda_auto_blogger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.auto_blog.arn,
        "${aws_s3_bucket.auto_blog.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_auto_blogger_ses" {
  name = "${var.project}-${local.normalized_env}-lambda-ab-ses"
  role = aws_iam_role.lambda_auto_blogger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = [
        "arn:aws:ses:us-east-1:${local.account_id}:identity/${var.hosted_zone}",
        "arn:aws:ses:us-east-1:${local.account_id}:configuration-set/${aws_sesv2_configuration_set.transactional.configuration_set_name}",
        "arn:aws:ses:us-east-1:${local.account_id}:configuration-set/${aws_sesv2_configuration_set.marketing.configuration_set_name}"
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_auto_blogger_logs" {
  name = "${var.project}-${local.normalized_env}-lambda-ab-logs"
  role = aws_iam_role.lambda_auto_blogger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "arn:aws:logs:${var.aws_region}:${local.account_id}:*"
    }]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# CloudWatch log groups (pre-created so retention is controlled by terraform)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "auto_blogger_topics" {
  count             = var.enable_auto_blogger_lambdas ? 1 : 0
  name              = "/aws/lambda/${local.lambda_topics_name}"
  retention_in_days = 30

  tags = { Environment = var.environment }
}

resource "aws_cloudwatch_log_group" "auto_blogger_news" {
  count             = var.enable_auto_blogger_lambdas ? 1 : 0
  name              = "/aws/lambda/${local.lambda_news_name}"
  retention_in_days = 30

  tags = { Environment = var.environment }
}

# ─────────────────────────────────────────────────────────────────────────────
# Lambda functions
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_lambda_function" "auto_blogger_topics" {
  count         = var.enable_auto_blogger_lambdas ? 1 : 0
  function_name = local.lambda_topics_name
  role          = aws_iam_role.lambda_auto_blogger.arn
  handler       = "index.topicsHandler"
  runtime       = "nodejs22.x"

  # GHA calls `aws lambda update-function-code` on every push — terraform
  # controls config only. lifecycle.ignore_changes prevents terraform from
  # rolling back code deployments made by GHA.
  filename = local.lambda_zip_path
  # Only hash the zip when the flag is true (zip must be built before first apply).
  # Terraform short-circuits the ternary so filebase64sha256 is not called when count=0.
  source_code_hash = var.enable_auto_blogger_lambdas ? filebase64sha256(local.lambda_zip_path) : ""

  memory_size = 1024
  timeout     = 900

  # Prevent EventBridge retry storms from double-firing the daily cycle.
  reserved_concurrent_executions = 1

  environment {
    variables = {
      # jsdom (29.x) transitive deps include html-encoding-sniffer@6 which
      # require()s @exodus/bytes (ESM-only). Node 22 throws ERR_REQUIRE_ESM
      # without this flag. Default-on in Node 22.12+, but the Lambda nodejs22.x
      # runtime currently ships an older patch.
      NODE_OPTIONS            = "--experimental-require-module"
      ANTHROPIC_API_KEY       = var.anthropic_api_key
      GEMINI_API_KEY          = var.gemini_api_key
      OPENAI_API_KEY          = var.openai_api_key
      AUTO_BLOG_S3_BUCKET     = local.s3_auto_blog_bucket_name
      AUTO_BLOG_S3_PREFIX     = "auto-blogger"
      AUTO_BLOG_NOTIFY_TO     = var.auto_blog_notify_to
      AUTO_BLOG_NOTIFY_FROM   = var.from_email
      AUTO_BLOG_STATE_TABLE   = local.dynamodb_table_name
      AWS_SES_REGION          = "us-east-1"
      NODE_ENV                = "production"
      DAILY_ARTICLES          = "1"
      AI_CALL_DELAY_MS        = "2000"
      AUTO_BLOG_IMAGE_MODEL   = "gemini-2.5-flash-image"
      AUTO_BLOG_IMAGE_STYLE   = "stencil"
      AUTO_BLOG_IMAGE_PALETTE = "vibrant"
    }
  }

  lifecycle {
    ignore_changes = [source_code_hash, filename, last_modified]
  }

  tags = {
    Name        = local.lambda_topics_name
    Environment = var.environment
  }
}

resource "aws_lambda_function" "auto_blogger_news" {
  count         = var.enable_auto_blogger_lambdas ? 1 : 0
  function_name = local.lambda_news_name
  role          = aws_iam_role.lambda_auto_blogger.arn
  handler       = "index.newsHandler"
  runtime       = "nodejs22.x"

  filename         = local.lambda_zip_path
  source_code_hash = var.enable_auto_blogger_lambdas ? filebase64sha256(local.lambda_zip_path) : ""

  memory_size = 1024
  timeout     = 900

  reserved_concurrent_executions = 1

  environment {
    variables = {
      # jsdom (29.x) transitive deps include html-encoding-sniffer@6 which
      # require()s @exodus/bytes (ESM-only). Node 22 throws ERR_REQUIRE_ESM
      # without this flag. Default-on in Node 22.12+, but the Lambda nodejs22.x
      # runtime currently ships an older patch.
      NODE_OPTIONS            = "--experimental-require-module"
      ANTHROPIC_API_KEY       = var.anthropic_api_key
      GEMINI_API_KEY          = var.gemini_api_key
      OPENAI_API_KEY          = var.openai_api_key
      AUTO_BLOG_S3_BUCKET     = local.s3_auto_blog_bucket_name
      AUTO_BLOG_S3_PREFIX     = "auto-blogger"
      AUTO_BLOG_NOTIFY_TO     = var.auto_blog_notify_to
      AUTO_BLOG_NOTIFY_FROM   = var.from_email
      AUTO_BLOG_STATE_TABLE   = local.dynamodb_table_name
      AWS_SES_REGION          = "us-east-1"
      NODE_ENV                = "production"
      AUTO_BLOG_IMAGE_MODEL   = "gemini-2.5-flash-image"
      AUTO_BLOG_IMAGE_STYLE   = "stencil"
      AUTO_BLOG_IMAGE_PALETTE = "vibrant"
    }
  }

  lifecycle {
    ignore_changes = [source_code_hash, filename, last_modified]
  }

  tags = {
    Name        = local.lambda_news_name
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Lambda resource-based policies (allow EventBridge Scheduler to invoke)
# Both halves are required: the scheduler role (below) AND these resource policies.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_lambda_permission" "scheduler_invoke_topics" {
  for_each      = var.enable_auto_blogger_lambdas ? local.topics_schedules : {}
  statement_id  = "AllowSchedulerInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_blogger_topics[0].function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = aws_scheduler_schedule.auto_blogger_topics[each.key].arn
}

resource "aws_lambda_permission" "scheduler_invoke_news" {
  count         = var.enable_auto_blogger_lambdas ? 1 : 0
  statement_id  = "AllowSchedulerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_blogger_news[0].function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = aws_scheduler_schedule.auto_blogger_news[0].arn
}

# ─────────────────────────────────────────────────────────────────────────────
# IAM role for EventBridge Scheduler (role side of the invoke permission)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "scheduler_auto_blogger" {
  count = var.enable_auto_blogger_lambdas ? 1 : 0
  name  = "${var.project}-${local.normalized_env}-scheduler-auto-blogger"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
    }]
  })

  tags = { Environment = var.environment }
}

resource "aws_iam_role_policy" "scheduler_invoke_lambda" {
  count = var.enable_auto_blogger_lambdas ? 1 : 0
  name  = "${var.project}-${local.normalized_env}-scheduler-ab-invoke"
  role  = aws_iam_role.scheduler_auto_blogger[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "lambda:InvokeFunction"
      Resource = [
        aws_lambda_function.auto_blogger_topics[0].arn,
        aws_lambda_function.auto_blogger_news[0].arn
      ]
    }]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# EventBridge Scheduler schedules (cron, Australia/Sydney timezone)
# Topics 09:00 for one net-new article, 14:00 reserved for refresh/update work.
# News 10:00 every day.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  topics_schedules = {
    "09h-new"     = { hour = 9, description = "09:00 Sydney net-new topic", slot = "new-topic" }
    "14h-refresh" = { hour = 14, description = "14:00 Sydney refresh/update slot", slot = "refresh" }
  }
}

resource "aws_scheduler_schedule" "auto_blogger_topics" {
  for_each    = var.enable_auto_blogger_lambdas ? local.topics_schedules : {}
  name        = "${var.project}-${local.normalized_env}-auto-blogger-topics-${each.key}"
  group_name  = "default"
  description = "Auto-blogger topic article (${each.value.description})"
  state       = var.enable_auto_blogger_schedules ? "ENABLED" : "DISABLED"

  schedule_expression          = "cron(0 ${each.value.hour} * * ? *)"
  schedule_expression_timezone = "Australia/Sydney"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.auto_blogger_topics[0].arn
    role_arn = aws_iam_role.scheduler_auto_blogger[0].arn
    input    = jsonencode({ slot = each.value.slot })

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_scheduler_schedule" "auto_blogger_news" {
  count       = var.enable_auto_blogger_lambdas ? 1 : 0
  name        = "${var.project}-${local.normalized_env}-auto-blogger-news"
  group_name  = "default"
  description = "Daily auto-blogger news post (10:00 Sydney)"
  state       = var.enable_auto_blogger_schedules ? "ENABLED" : "DISABLED"

  schedule_expression          = "cron(0 10 * * ? *)"
  schedule_expression_timezone = "Australia/Sydney"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.auto_blogger_news[0].arn
    role_arn = aws_iam_role.scheduler_auto_blogger[0].arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Add lambda:UpdateFunctionCode to the GitHub Actions deployer policy
# so GHA can push new code without a terraform apply.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_iam_policy" "github_actions_lambda_deploy" {
  count       = var.enable_auto_blogger_lambdas ? 1 : 0
  name        = "${var.project}-${var.environment}-lambda-deploy-policy"
  description = "Allow GitHub Actions to update auto-blogger Lambda function code"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:PublishVersion"
      ]
      Resource = [
        aws_lambda_function.auto_blogger_topics[0].arn,
        aws_lambda_function.auto_blogger_news[0].arn
      ]
    }]
  })
}

resource "aws_iam_user_policy_attachment" "github_actions_lambda_deploy" {
  count      = var.enable_auto_blogger_lambdas ? 1 : 0
  user       = aws_iam_user.github_actions_deployer.name
  policy_arn = aws_iam_policy.github_actions_lambda_deploy[0].arn
}
