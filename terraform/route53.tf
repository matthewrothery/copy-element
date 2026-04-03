data "aws_route53_zone" "main" {
  name         = var.hosted_zone
  private_zone = false
}

locals {
  apex_txt_values = compact([var.search_console_txt, var.gmail_txt])
}

# Website A record
resource "aws_route53_record" "website_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.website_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# www subdomain A record
resource "aws_route53_record" "www_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.website_domain}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# Apex TXT record for domain verification
resource "aws_route53_record" "apex_txt" {
  count   = length(local.apex_txt_values) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.website_domain
  type    = "TXT"
  ttl     = 300
  records = local.apex_txt_values
}

# MCP subdomain A record
resource "aws_route53_record" "mcp_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.mcp_subdomain}.${var.hosted_zone}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.mcp.domain_name
    zone_id                = aws_cloudfront_distribution.mcp.hosted_zone_id
    evaluate_target_health = false
  }
}

# Admin SPA A record
resource "aws_route53_record" "admin_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.admin_subdomain}.${var.hosted_zone}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.admin.domain_name
    zone_id                = aws_cloudfront_distribution.admin.hosted_zone_id
    evaluate_target_health = false
  }
}

# Gmail / Google Workspace MX record (apex)
resource "aws_route53_record" "gmail_mx" {
  count   = length(var.gmail_mx) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.website_domain
  type    = "MX"
  ttl     = 300
  records = ["${var.gmail_mx_priority} ${var.gmail_mx}."]
}
