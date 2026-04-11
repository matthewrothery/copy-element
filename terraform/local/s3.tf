resource "aws_s3_bucket" "assets" {
  bucket = "element-armory-assets-local"
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_origins = [
      "http://localhost:3000",
      "http://localhost:9900",
      "http://localhost:8840",
    ]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}
