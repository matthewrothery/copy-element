# SES domain identity
resource "aws_ses_domain_identity" "main" {
  provider = aws.us_east_1
  domain   = var.hosted_zone
}

# DKIM tokens for the domain
resource "aws_ses_domain_dkim" "main" {
  provider = aws.us_east_1
  domain   = aws_ses_domain_identity.main.domain
}

# Custom MAIL FROM subdomain — aligns SPF return-path with our domain
resource "aws_ses_domain_mail_from" "main" {
  provider         = aws.us_east_1
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.hosted_zone}"
}

# Configuration set: transactional (receipts, auth emails, password resets)
resource "aws_sesv2_configuration_set" "transactional" {
  provider               = aws.us_east_1
  configuration_set_name = "${var.project}-transactional"

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

# Configuration set: marketing (newsletters, announcements)
resource "aws_sesv2_configuration_set" "marketing" {
  provider               = aws.us_east_1
  configuration_set_name = "${var.project}-marketing"

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

# SNS topics for bounce and complaint notifications — must be in same region as SES (us-east-1)
resource "aws_sns_topic" "ses_bounces" {
  provider = aws.us_east_1
  name     = "${var.project}-${var.environment}-ses-bounces"
}

resource "aws_sns_topic" "ses_complaints" {
  provider = aws.us_east_1
  name     = "${var.project}-${var.environment}-ses-complaints"
}

# SES must be allowed to publish to these topics (same region as SES: us-east-1)
data "aws_iam_policy_document" "ses_sns_publish_bounces" {
  statement {
    sid    = "AllowSESPublish"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.ses_bounces.arn]
  }
}

data "aws_iam_policy_document" "ses_sns_publish_complaints" {
  statement {
    sid    = "AllowSESPublish"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.ses_complaints.arn]
  }
}

resource "aws_sns_topic_policy" "ses_bounces" {
  provider = aws.us_east_1
  arn      = aws_sns_topic.ses_bounces.arn
  policy   = data.aws_iam_policy_document.ses_sns_publish_bounces.json
}

resource "aws_sns_topic_policy" "ses_complaints" {
  provider = aws.us_east_1
  arn      = aws_sns_topic.ses_complaints.arn
  policy   = data.aws_iam_policy_document.ses_sns_publish_complaints.json
}

# Event destinations — transactional config set
resource "aws_sesv2_configuration_set_event_destination" "transactional_bounce" {
  provider               = aws.us_east_1
  configuration_set_name = aws_sesv2_configuration_set.transactional.configuration_set_name
  event_destination_name = "transactional-bounce"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE"]

    sns_destination {
      topic_arn = aws_sns_topic.ses_bounces.arn
    }
  }

  depends_on = [aws_sns_topic_policy.ses_bounces]
}

resource "aws_sesv2_configuration_set_event_destination" "transactional_complaint" {
  provider               = aws.us_east_1
  configuration_set_name = aws_sesv2_configuration_set.transactional.configuration_set_name
  event_destination_name = "transactional-complaint"

  event_destination {
    enabled              = true
    matching_event_types = ["COMPLAINT"]

    sns_destination {
      topic_arn = aws_sns_topic.ses_complaints.arn
    }
  }

  depends_on = [aws_sns_topic_policy.ses_complaints]
}

# Event destinations — marketing config set
resource "aws_sesv2_configuration_set_event_destination" "marketing_bounce" {
  provider               = aws.us_east_1
  configuration_set_name = aws_sesv2_configuration_set.marketing.configuration_set_name
  event_destination_name = "marketing-bounce"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE"]

    sns_destination {
      topic_arn = aws_sns_topic.ses_bounces.arn
    }
  }

  depends_on = [aws_sns_topic_policy.ses_bounces]
}

resource "aws_sesv2_configuration_set_event_destination" "marketing_complaint" {
  provider               = aws.us_east_1
  configuration_set_name = aws_sesv2_configuration_set.marketing.configuration_set_name
  event_destination_name = "marketing-complaint"

  event_destination {
    enabled              = true
    matching_event_types = ["COMPLAINT"]

    sns_destination {
      topic_arn = aws_sns_topic.ses_complaints.arn
    }
  }

  depends_on = [aws_sns_topic_policy.ses_complaints]
}

# Wire bounce and complaint SNS notifications to the domain identity
resource "aws_ses_identity_notification_topic" "bounce" {
  provider                 = aws.us_east_1
  topic_arn                = aws_sns_topic.ses_bounces.arn
  notification_type        = "Bounce"
  identity                 = aws_ses_domain_identity.main.domain
  include_original_headers = false

  depends_on = [aws_sns_topic_policy.ses_bounces]
}

resource "aws_ses_identity_notification_topic" "complaint" {
  provider                 = aws.us_east_1
  topic_arn                = aws_sns_topic.ses_complaints.arn
  notification_type        = "Complaint"
  identity                 = aws_ses_domain_identity.main.domain
  include_original_headers = false

  depends_on = [aws_sns_topic_policy.ses_complaints]
}
