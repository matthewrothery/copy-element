# GitHub Actions — Secrets & Variables Setup

Two workflows run on push to `master`:

| Workflow | Trigger | What it does |
|---|---|---|
| `deploy-apps.yml` | `server/**` changed | Builds Docker image → pushes to ECR → SSM deploys to EC2 |
| `deploy-website.yml` | `website/**` changed | Builds Next.js → syncs to S3 → invalidates CloudFront |

---

## Step 1 — Apply Terraform

Run `terraform apply` first. The IAM user, policy, and all AWS resources are created by Terraform. You will need the outputs in the steps below.

```bash
cd terraform
aws-vault exec <your-profile> -- terraform apply -var-file=./variables/prod.tfvars
```

After apply, print outputs:

```bash
aws-vault exec <your-profile> -- terraform output
```

---

## Step 2 — Generate IAM Access Keys

Terraform creates the IAM user but not its access keys (by design — keys must not be stored in Terraform state).

1. Go to **AWS Console → IAM → Users → `copy-element-prod-github-deployer`**
2. **Security credentials** tab → **Create access key**
3. Use case: **Third-party service**
4. Copy the **Access key ID** and **Secret access key** — you will not see the secret again

---

## Step 3 — Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → Secrets**.

Add the following secrets:

### AWS credentials

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Access key ID from Step 2 |
| `AWS_SECRET_ACCESS_KEY` | Secret access key from Step 2 |
| `AWS_REGION` | `us-east-2` (or your region from `var.aws_region`) |

### Server deployment (`deploy-apps.yml`)

| Secret | How to get it |
|---|---|
| `EC2_INSTANCE_ID` | `terraform output ec2_instance_id` |

### Website deployment (`deploy-website.yml`)

| Secret | How to get it |
|---|---|
| `S3_WEBSITE_BUCKET` | `terraform output s3_website_bucket` |
| `CLOUDFRONT_WEBSITE_DISTRIBUTION_ID` | `terraform output cloudfront_website_distribution_id` |

---

## Step 4 — Add GitHub Variables (optional)

Go to **Settings → Secrets and variables → Actions → Variables**.

These are non-sensitive and have working defaults, but you can override them:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://app.elementarmory.com` | Baked into the Next.js build as the API/app origin |
| `NEXT_PUBLIC_CHROME_STORE_URL` | `https://chromewebstore.google.com/detail/element-armory-%E2%80%93-capture/ihndemikooddnhleamneebgedomkench` | Baked into the Next.js build for all website "Add to Chrome" CTAs |

---

## What Terraform manages vs. what you manage manually

| Thing | Managed by |
|---|---|
| IAM user `copy-element-prod-github-deployer` | Terraform |
| IAM policy and permissions | Terraform |
| IAM access keys | You (manual, never in Terraform state) |
| EC2 instance ID | Terraform output |
| S3 bucket name | Terraform output |
| CloudFront distribution ID | Terraform output |
| GitHub secrets | You (manual, in GitHub UI) |

---

## Re-running a deployment manually

Both workflows have `workflow_dispatch` enabled — you can trigger them from the **Actions** tab in GitHub without pushing code.

To re-deploy the server manually via the CLI:

```bash
aws-vault exec <your-profile> -- aws ssm send-command \
  --instance-ids "<EC2_INSTANCE_ID>" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo -u ec2-user /home/ec2-user/copy-element/start.sh"]' \
  --region us-east-2
```
