# Certificate for website (CloudFront requires us-east-1)
resource "aws_acm_certificate" "website_cert" {
  provider                  = aws.us_east_1
  domain_name               = var.website_domain
  subject_alternative_names = ["www.${var.website_domain}"]
  validation_method         = "DNS"

  tags = {
    Name        = "${var.project}-${var.environment}-website-cert"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "website_cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.website_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.website_cert_validation : record.fqdn]

  timeouts {
    create = "10m"
  }
}

# Certificate for MCP subdomain (CloudFront requires us-east-1)
resource "aws_acm_certificate" "mcp_cert" {
  provider          = aws.us_east_1
  domain_name       = "${var.mcp_subdomain}.${var.hosted_zone}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project}-${var.environment}-mcp-cert"
    Environment = var.environment
  }
}

resource "aws_acm_certificate_validation" "mcp_cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.mcp_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.mcp_cert_validation : record.fqdn]

  timeouts {
    create = "10m"
  }
}

resource "aws_route53_record" "mcp_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.mcp_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Certificate for admin subdomain (CloudFront requires us-east-1)
resource "aws_acm_certificate" "admin_cert" {
  provider          = aws.us_east_1
  domain_name       = "${var.admin_subdomain}.${var.hosted_zone}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project}-${var.environment}-admin-cert"
    Environment = var.environment
  }
}

resource "aws_acm_certificate_validation" "admin_cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.admin_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.admin_cert_validation : record.fqdn]

  timeouts {
    create = "10m"
  }
}

resource "aws_route53_record" "admin_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.admin_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_route53_record" "website_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}
