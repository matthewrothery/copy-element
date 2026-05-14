# Website bucket
resource "aws_s3_bucket" "website" {
  bucket = var.s3_website_bucket

  tags = {
    Name        = var.s3_website_bucket
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_cloudfront_origin_access_identity" "website" {}

data "aws_iam_policy_document" "website_s3_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.website.arn}",
      "${aws_s3_bucket.website.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.website.iam_arn]
    }
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      aws_s3_bucket.website.arn
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.website.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = aws_s3_bucket.website.id
  policy = data.aws_iam_policy_document.website_s3_policy.json
}

# Assets bucket (name: {base}-{environment}, e.g. element-armory-assets-prod) for capture screenshots and large assets
resource "aws_s3_bucket" "assets" {
  bucket = local.s3_assets_bucket_name

  tags = {
    Name        = local.s3_assets_bucket_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Auto-blog artifact bucket (private staging for generated topic content)
resource "aws_s3_bucket" "auto_blog" {
  bucket = local.s3_auto_blog_bucket_name

  tags = {
    Name        = local.s3_auto_blog_bucket_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "auto_blog" {
  bucket = aws_s3_bucket.auto_blog.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "auto_blog" {
  bucket = aws_s3_bucket.auto_blog.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "auto_blog" {
  bucket = aws_s3_bucket.auto_blog.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "auto_blog" {
  bucket = aws_s3_bucket.auto_blog.id

  rule {
    id     = "expire-published-and-failed-artifacts"
    status = "Enabled"

    filter {
      prefix = "auto-blogger/published/"
    }

    expiration {
      days = 180
    }
  }

  rule {
    id     = "expire-failed-artifacts"
    status = "Enabled"

    filter {
      prefix = "auto-blogger/failed/"
    }

    expiration {
      days = 90
    }
  }
}

locals {
  s3_origin_id             = "${var.project}_${upper(replace(var.environment, "/\\W|_|\\s/", "-"))}_WEBSITE_ORIGIN"
  s3_auto_blog_bucket_name = "${var.s3_auto_blog_bucket_base}-${var.environment}"
}
