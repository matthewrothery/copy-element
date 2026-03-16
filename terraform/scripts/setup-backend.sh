#!/usr/bin/env bash
set -euo pipefail

# One-time setup: create S3 bucket for Terraform state (versioning required for S3 lockfiles).
# Run with: AWS_REGION=us-east-2 aws-vault exec <profile> -- ./scripts/setup-backend.sh
# (from the terraform/ directory)

AWS_REGION="${AWS_REGION:-us-east-2}"
STATE_BUCKET="${STATE_BUCKET:-copy-element-terraform-state}"

echo "Creating Terraform backend bucket (region=$AWS_REGION, bucket=$STATE_BUCKET)..."

if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  echo "S3 bucket $STATE_BUCKET already exists."
else
  aws s3 mb "s3://$STATE_BUCKET" --region "$AWS_REGION"
  echo "Created S3 bucket $STATE_BUCKET."
fi

aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "Backend setup complete."
