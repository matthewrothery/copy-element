data "aws_route53_zone" "main" {
  name         = var.hosted_zone
  private_zone = false
}

locals {
  # SPF record always included — covers both SES and Google Workspace senders
  ses_spf_record  = "v=spf1 include:amazonses.com include:_spf.google.com ~all"
  apex_txt_values = compact([var.search_console_txt, var.gmail_txt, local.ses_spf_record])

  # Route 53 TXT: each character-string must be ≤255 chars (RFC 1035).
  # Multiple character-strings must live in ONE TXT record — resolvers concatenate them.
  # regexall avoids integer-division edge cases from length()/255 arithmetic.
  # Strip surrounding quotes defensively — Google Admin sometimes shows the value in quotes.
  _gmail_dkim_raw    = trimsuffix(trimprefix(trimspace(var.gmail_dkim_txt), "\""), "\"")
  _gmail_dkim_chunks = length(local._gmail_dkim_raw) == 0 ? [] : regexall(".{1,255}", local._gmail_dkim_raw)
  # The AWS provider auto-wraps each records element in outer quotes before sending to Route 53.
  # So we only add the inner " " separators between chunks — the provider supplies the outer quotes,
  # producing the correct format: "chunk1" "chunk2" (one TXT record, multiple character-strings).
  gmail_dkim_txt_records = length(local._gmail_dkim_chunks) == 0 ? [] : [
    join("\" \"", local._gmail_dkim_chunks)
  ]
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

# SES domain verification TXT record
resource "aws_route53_record" "ses_verification" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_amazonses.${var.hosted_zone}"
  type    = "TXT"
  ttl     = 300
  records = [aws_ses_domain_identity.main.verification_token]
}

# SES DKIM CNAME records (3 tokens)
resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${aws_ses_domain_dkim.main.dkim_tokens[count.index]}._domainkey.${var.hosted_zone}"
  type    = "CNAME"
  ttl     = 300
  records = ["${aws_ses_domain_dkim.main.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# DMARC TXT record
resource "aws_route53_record" "dmarc" {
  count   = var.ses_dmarc_rua != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.hosted_zone}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=${var.ses_dmarc_policy}; rua=mailto:${var.ses_dmarc_rua}; fo=1"]
}

# Custom MAIL FROM MX record — routes bounces back through our subdomain
resource "aws_route53_record" "mail_from_mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "mail.${var.hosted_zone}"
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.us-east-1.amazonses.com."]
}

# Custom MAIL FROM SPF TXT record
resource "aws_route53_record" "mail_from_spf" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "mail.${var.hosted_zone}"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# Gmail / Google Workspace MX record (apex)
resource "aws_route53_record" "gmail_mx" {
  count   = length(var.gmail_mx) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.website_domain
  type    = "MX"
  ttl     = 300
  # trimsuffix: var may include trailing dot; we always emit FQDN with one dot (double dot → DomainLabelEmpty)
  records = ["${var.gmail_mx_priority} ${trimsuffix(var.gmail_mx, ".")}."]
}

# Google Workspace DKIM (TXT at google._domainkey)
resource "aws_route53_record" "gmail_dkim" {
  count   = length(var.gmail_dkim_txt) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "google._domainkey.${var.hosted_zone}"
  type    = "TXT"
  ttl     = 300
  records = local.gmail_dkim_txt_records
}
