resource "aws_cloudfront_distribution" "website" {
  # EC2 origin for dynamic API collect endpoint
  origin {
    domain_name = aws_eip.ec2.public_dns
    origin_id   = "website-collect-ec2"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 30
    }
  }

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.website.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  comment             = "${var.project} website"
  default_root_object = "index.html"

  aliases = [var.website_domain, "www.${var.website_domain}"]

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
  }

  price_class = var.website_price_class

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    cache_policy_id            = aws_cloudfront_cache_policy.website_html_cache.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.website_s3_origin.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.website_security_headers.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite_nextjs_routes.arn
    }
  }

  # Route /api/collect/* to EC2 — evaluated before default S3 behavior
  ordered_cache_behavior {
    path_pattern     = "/api/collect/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "website-collect-ec2"

    viewer_protocol_policy = "redirect-to-https"
    compress               = false

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  ordered_cache_behavior {
    path_pattern     = "/_next/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.website_static_assets_cache.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.website_s3_origin.id
  }

  ordered_cache_behavior {
    path_pattern     = "/images/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    cache_policy_id          = aws_cloudfront_cache_policy.website_static_assets_cache.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.website_s3_origin.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.website_cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudfront_function" "rewrite_nextjs_routes" {
  name    = "rewrite-nextjs-routes-${random_id.id.hex}"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite Next.js SSG routes to append .html extension and redirect www to non-www"
  publish = true
  code    = <<EOF
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var host = request.headers.host.value;

    if (host.startsWith('www.')) {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: 'https://' + host.substring(4) + uri }
            }
        };
    }

    if (uri.match(/\.[a-zA-Z0-9]+$/) && !uri.endsWith('/')) {
        return request;
    }

    if (uri.endsWith('/')) {
        uri = uri.slice(0, -1);
    }

    if (uri === '' || uri === '/') {
        request.uri = '/index.html';
        return request;
    }

    request.uri = uri + '.html';
    return request;
}
EOF
}

resource "random_id" "id" {
  byte_length = 8
}

data "aws_cloudfront_cache_policy" "website_caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_origin_request_policy" "website_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

resource "aws_cloudfront_response_headers_policy" "website_security_headers" {
  name    = "${var.project}-website-security-headers"
  comment = "Security headers for ${var.project} marketing site"

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
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    xss_protection {
      protection  = true
      mode_block  = true
      override    = true
    }
  }
}

resource "aws_cloudfront_cache_policy" "website_html_cache" {
  name        = "${var.project}-website-html-cache"
  comment     = "HTML cache policy for ${var.project} marketing site"
  default_ttl = 600
  max_ttl     = 3600
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

resource "aws_cloudfront_cache_policy" "website_static_assets_cache" {
  name        = "${var.project}-website-static-assets-cache"
  comment     = "Long-lived cache policy for ${var.project} static assets (JS, CSS, images)"
  default_ttl = 2592000
  max_ttl     = 31536000
  min_ttl     = 86400

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
