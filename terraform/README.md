# Element Armory Terraform Infrastructure

This directory contains Terraform configuration for deploying Element Armory (element-armory) to AWS.

## Architecture

- **EC2 Instance**: Single t3.small instance running Docker Compose with the API/server and nginx
- **RDS PostgreSQL**: Managed database in private subnet
- **CloudFront**: Two distributions — website (static S3) and app (EC2 origin)
- **S3**: Website bucket for marketing site; assets bucket for capture screenshots and large assets
- **Route53**: DNS management
- **ECR**: Single Docker image repository for the server

## Prerequisites

1. [aws-vault](https://github.com/99designs/aws-vault) configured with a profile for the AWS account. MFA on the account is recommended.
2. Docker and Docker Compose (Terraform can run in Docker for a consistent version; local Terraform is optional).
3. S3 bucket for Terraform state with versioning enabled (one-time setup below). State locking uses S3 lockfiles.

## Setup

1. **Create Terraform state bucket** (one-time). From the `terraform/` directory:

```bash
AWS_REGION=us-east-2 aws-vault exec <profile> -- ./scripts/setup-backend.sh
```

2. **Copy and configure variables**:

```bash
cp variables/prod.tfvars.example variables/prod.tfvars
# Edit variables/prod.tfvars with your actual values (domains, DB, ECR name, session_secret, cookie_secret).
# Do not commit prod.tfvars.
```

3. **Initialise the environment** (backend key is set from `TF_VAR_environment`, default `prod`):

```bash
AWS_REGION=us-east-2 TF_VAR_environment=prod aws-vault exec demoly --no-session -- docker-compose run --rm terraform init --backend-config "region=$AWS_REGION" -reconfigure -lock-timeout=360s -backend-config "key=state/${TF_VAR_environment:-prod}"
```

4. **Plan and apply**:

```bash
AWS_REGION=us-east-2 aws-vault exec demoly -- docker-compose run --rm terraform plan -var-file=./variables/prod.tfvars
AWS_REGION=us-east-2 aws-vault exec demoly -- docker-compose run --rm terraform apply -var-file=./variables/prod.tfvars
```

Replace `<profile>` with your aws-vault profile name. Terraform runs in Docker so the version is consistent; AWS credentials are passed through from `aws-vault exec`.

## Deployment

### Server (API)

Build and push the server image, then apply Terraform to push runtime config and run deployment on EC2 via SSM:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-2.amazonaws.com

# Build and push (from repo root; adjust path if your Dockerfile is elsewhere)
docker build -t $(terraform output -raw ecr_server_repo_url):latest ./server
docker push $(terraform output -raw ecr_server_repo_url):latest

# Apply infrastructure + run deployment on EC2
AWS_REGION=us-east-2 aws-vault exec <profile> -- docker-compose run --rm terraform apply -var-file=./variables/prod.tfvars
```

Optional: re-run the deploy script on EC2 via SSM without re-applying Terraform:

```bash
aws ssm send-command \
  --instance-ids $(terraform output -raw ec2_instance_id) \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo -u ec2-user /home/ec2-user/element-armory/start.sh"]'
```

### Website (optional)

If you use a static export (e.g. Next.js) for the marketing site:

```bash
cd ../website
npm run build

# Sync to S3 (adjust source path to your build output, e.g. out/ or .next/static)
aws s3 sync out s3://$(terraform output -raw s3_website_bucket) --delete --cache-control "public, max-age=31536000, immutable"
aws s3 sync out s3://$(terraform output -raw s3_website_bucket) --exclude "*" --include "*.html" --cache-control "public, max-age=300, s-maxage=300"

aws cloudfront create-invalidation --distribution-id $(terraform output -raw cloudfront_website_distribution_id) --paths "/*"
```

## Destroy

To destroy all resources:

```bash
AWS_REGION=us-east-2 aws-vault exec <profile> -- docker-compose run --rm terraform apply -destroy -var-file=./variables/prod.tfvars
```

To force-unlock a stuck state:

```bash
AWS_REGION=us-east-2 aws-vault exec <profile> --no-session -- docker-compose run --rm terraform force-unlock 'LOCK_ID'
```

## GitHub Actions

The infrastructure creates an IAM user for GitHub Actions deployment. To use it:

1. Create access keys for the IAM user in AWS Console (IAM → Users → `<project>-<env>-github-deployer` → Security credentials → Create access key).
2. Add repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and optionally `EC2_INSTANCE_ID`, `S3_WEBSITE_BUCKET`, `CLOUDFRONT_WEBSITE_DISTRIBUTION_ID` from `terraform output`.

## Security

- `variables/prod.tfvars` contains sensitive data and is git-ignored.
- Terraform state is stored in an encrypted S3 bucket.
- EC2 uses an IAM instance profile (no access keys on the instance).
- RDS is in a private subnet and not publicly accessible.
- Runtime `.env` and config files are pushed to EC2 via AWS SSM on `terraform apply`.

## Files

- `main.tf` — Provider configuration and backend
- `variables.tf` — Variable definitions
- `vpc.tf` — VPC, subnets, routing
- `security-groups.tf` — Security group rules
- `ec2.tf` — EC2 instance and SSM associations
- `rds.tf` — RDS PostgreSQL
- `s3.tf` — Website and assets buckets
- `cloudfront-website.tf` — CloudFront for marketing site
- `cloudfront-app.tf` — CloudFront for app origin
- `route53.tf` — DNS records
- `acm.tf` — SSL certificates
- `ecr.tf` — Docker repository for server
- `iam.tf` — IAM roles and GitHub Actions user
- `outputs.tf` — Output values
- `scripts/` — setup-backend.sh, user-data.sh, start.sh
- `templates/` — docker-compose.prod.yml, nginx.conf, env.template
- `variables/prod.tfvars.example` — Example variable values
