# LocalStack accepts SES domain identities without DNS verification
resource "aws_ses_domain_identity" "local" {
  domain = "localhost"
}
