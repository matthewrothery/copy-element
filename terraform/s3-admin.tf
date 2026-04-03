resource "aws_s3_bucket" "admin" {
  bucket = var.s3_admin_bucket

  tags = {
    Name        = var.s3_admin_bucket
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "admin" {
  bucket = aws_s3_bucket.admin.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "admin" {
  bucket = aws_s3_bucket.admin.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_cloudfront_origin_access_identity" "admin" {}

data "aws_iam_policy_document" "admin_s3_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.admin.arn}",
      "${aws_s3_bucket.admin.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.admin.iam_arn]
    }
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.admin.arn]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.admin.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "admin_bucket_policy" {
  bucket = aws_s3_bucket.admin.id
  policy = data.aws_iam_policy_document.admin_s3_policy.json
}

locals {
  s3_admin_origin_id = "${var.project}_${upper(replace(var.environment, "/\\W|_|\\s/", "-"))}_ADMIN_ORIGIN"
}
