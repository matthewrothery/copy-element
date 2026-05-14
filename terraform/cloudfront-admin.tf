resource "aws_cloudfront_distribution" "admin" {
  origin {
    domain_name = aws_s3_bucket.admin.bucket_regional_domain_name
    origin_id   = local.s3_admin_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.admin.cloudfront_access_identity_path
    }
  }

  # EC2 origin for API requests
  origin {
    domain_name = aws_eip.ec2.public_dns
    origin_id   = "admin-api-ec2"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 30
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  comment             = "${var.project} admin SPA"
  default_root_object = "index.html"

  aliases = ["${var.admin_subdomain}.${var.hosted_zone}"]

  # SPA fallback: serve index.html for 403/404 so React Router handles routing
  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  price_class = "PriceClass_100"

  # Forward /api/* to EC2 server — evaluated before S3 behaviors
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "admin-api-ec2"

    viewer_protocol_policy = "redirect-to-https"
    compress               = false

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  # Long-lived cache for hashed assets
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_admin_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.website_static_assets_cache.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.website_s3_origin.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_admin_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # HTML: short TTL so re-deploys propagate quickly
    cache_policy_id            = aws_cloudfront_cache_policy.admin_html_cache.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.website_s3_origin.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.admin_security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.admin_cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudfront_cache_policy" "admin_html_cache" {
  name        = "${var.project}-admin-html-cache"
  comment     = "HTML cache policy for ${var.project} admin SPA (always fresh)"
  default_ttl = 0
  max_ttl     = 60
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

resource "aws_cloudfront_response_headers_policy" "admin_security_headers" {
  name    = "${var.project}-admin-security-headers"
  comment = "Security headers for ${var.project} admin SPA"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = false
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }
  }
}
