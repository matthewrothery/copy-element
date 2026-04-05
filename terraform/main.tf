terraform {
  backend "s3" {
    bucket       = "element-armory-terraform-state"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
    # key supplied at init: -backend-config "key=state/$TF_VAR_environment"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.10.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7.2"
    }
  }
}

provider "aws" {
  shared_config_files      = ["~/.aws/config"]
  shared_credentials_files = ["~/.aws/credentials"]
  region                   = var.aws_region
}

# NOTE: CloudFront + SES (and SNS destinations for SES) must use us-east-1.
# Mirror default provider auth so alias always uses the same credentials.
provider "aws" {
  alias                    = "us_east_1"
  region                   = "us-east-1"
  shared_config_files      = ["~/.aws/config"]
  shared_credentials_files = ["~/.aws/credentials"]
}

data "aws_caller_identity" "current" {}

locals {
  normalized_env        = lower(replace(var.environment, "/\\W|_|\\s/", "-"))
  account_id            = data.aws_caller_identity.current.account_id
  s3_assets_bucket_name = "${var.s3_assets_bucket_base}-${local.normalized_env}"
}
