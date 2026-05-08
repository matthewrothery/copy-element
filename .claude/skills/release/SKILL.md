---
name: release
description: >
  Release one or more Element Armory components to production: build & push Docker images
  to ECR, run `terraform apply` (which pushes env files and triggers redeploy via SSM),
  and optionally rebuild + sync the marketing website to S3/CloudFront. Invoke with
  /release [component...] where component is one or more of: server, mcp, auto-blogger,
  website, terraform-only, all. If no args, ask the user which to release.
---

The user invoked `/release` to ship to production. Production runs on a single EC2 instance
managed by Terraform; runtime config is pushed via SSM associations on `terraform apply`,
which also runs `start.sh` to pull new images and restart the stack. See `terraform/README.md`.

## Core facts about this repo

- Working directory for terraform commands: `terraform/` (sub-directory of repo root).
- Terraform runs inside Docker via `docker-compose run --rm terraform`. Do NOT assume a local
  `terraform` binary — always use the docker-compose wrapper.
- AWS credentials come from `aws-vault`. The profile name in the README examples is `demoly`.
  ASK the user to confirm their aws-vault profile if you don't know it for this session.
- Region is `us-east-2`.
- ECR repos and outputs:
  - `server` → output `ecr_server_repo_url`
  - `mcp` → output `ecr_mcp_repo_url` (built from `./mcp-server`)
  - `auto-blogger` → output `ecr_auto_blogger_repo_url` (built from `./auto-blogger`)
- Website is a Next.js static export. Build output: `website/out/`. Synced to bucket from
  `s3_website_bucket` output, invalidated via `cloudfront_website_distribution_id`.
- `terraform apply` ALONE is enough to ship runtime env / config changes (no image rebuild).
  Use the `terraform-only` component for env-only changes.

## Steps

### 1. Determine what to release

Parse the args. Components: `server`, `mcp`, `auto-blogger`, `website`, `terraform-only`, `all`.

If no args, use AskUserQuestion (multiSelect) to ask which components to release. Offer the
five real components plus an "everything" option. Don't assume — release is destructive
enough that explicit confirmation is worth the round trip.

### 2. Pre-flight checks

Run these in parallel before starting any build:

- `git status` — warn if there are uncommitted changes (the user may want to commit first).
- `git rev-parse --abbrev-ref HEAD` — warn if not on `master`.
- `aws-vault list 2>/dev/null | head -5` — confirm aws-vault is available.
- Confirm with the user: "Release <components> to prod from <branch> at <short-sha>? (y/n)".
  Do NOT proceed without explicit confirmation. This is a production deploy.

### 3. Resolve outputs (once)

If any image build is needed, fetch ECR registry + repo URLs from terraform outputs in one
go. Run terraform output commands inside docker-compose:

```bash
cd terraform
AWS_REGION=us-east-2 aws-vault exec <profile> -- docker-compose run --rm terraform output -raw ecr_server_repo_url
```

Cache these in local shell vars within a single Bash call to avoid repeated docker startups.

Get ECR registry once via:

```bash
aws-vault exec <profile> -- aws sts get-caller-identity --query Account --output text
```

…then construct `<account>.dkr.ecr.us-east-2.amazonaws.com`.

Login once:

```bash
aws-vault exec <profile> -- aws ecr get-login-password --region us-east-2 \
  | docker login --username AWS --password-stdin <registry>
```

### 4. Build & push images (per component)

For each requested image-bearing component, build for linux/amd64 (EC2 is x86_64) and push:

- **server**: context `./server`, repo `ecr_server_repo_url`
- **mcp**: context `./mcp-server`, repo `ecr_mcp_repo_url`
- **auto-blogger**: context `./auto-blogger`, repo `ecr_auto_blogger_repo_url`

```bash
docker buildx build --platform linux/amd64 -t <repo_url>:latest --push ./<context>
```

If `buildx` is unavailable, fall back to `docker build --platform linux/amd64 ... && docker push`.

If multiple images are being released, run the builds in parallel (separate Bash calls in
one message) — they're independent.

### 5. Apply terraform

This pushes any updated env files / config templates AND triggers the SSM run-deployment
association, which executes `start.sh` on EC2 → docker compose pulls the new `:latest`
images and recreates containers.

```bash
cd terraform
AWS_REGION=us-east-2 aws-vault exec <profile> -- \
  docker-compose run --rm terraform apply -var-file=./variables/prod.tfvars
```

This is interactive (asks "yes" to apply). Use `-auto-approve` ONLY if the user explicitly
asked for autonomous mode. Default to letting them see the plan.

If only `terraform-only` was selected, this is the only step beyond confirmation.

### 6. Force redeploy (only if needed)

`terraform apply` re-triggers SSM associations when their inputs changed. If we're shipping
a new image but no terraform-managed file changed, the run_deployment association may not
re-fire. In that case, manually trigger start.sh:

```bash
aws-vault exec <profile> -- aws ssm send-command \
  --instance-ids $(cd terraform && AWS_REGION=us-east-2 aws-vault exec <profile> -- \
    docker-compose run --rm terraform output -raw ec2_instance_id) \
  --document-name "AWS-RunShellScript" \
  --region us-east-2 \
  --parameters 'commands=["sudo -u ec2-user /home/ec2-user/element-armory/start.sh"]' \
  --output text --query 'Command.CommandId'
```

Poll the command status with `aws ssm get-command-invocation` until it's `Success` or
`Failed`. Show the user the tail of the output either way.

Default behaviour: after a `terraform apply` that succeeded, ask the user whether they want
a forced redeploy. Only auto-trigger if a non-`terraform-only` image build happened AND
terraform reported "No changes" (meaning the image push wouldn't otherwise restart anything).

### 7. Website (if selected)

```bash
cd website
npm run build
# Sync long-lived assets first
aws-vault exec <profile> -- aws s3 sync out s3://<bucket> --delete \
  --cache-control "public, max-age=31536000, immutable"
# Then HTML with short cache
aws-vault exec <profile> -- aws s3 sync out s3://<bucket> --exclude "*" --include "*.html" \
  --cache-control "public, max-age=300, s-maxage=300"
# Invalidate
aws-vault exec <profile> -- aws cloudfront create-invalidation \
  --distribution-id <dist_id> --paths "/*"
```

Resolve `<bucket>` and `<dist_id>` from terraform outputs (cache from step 3).

### 8. Verification

After deployment, verify:

- `curl -sSf https://<app-domain>/health` (or whatever health endpoint exists) — ask user
  for the right URL if unclear.
- For auto-blogger: tail recent logs via SSM (`docker logs --tail 50 element-armory-auto-blogger`).
- Report a one-paragraph summary: what was built, what terraform changed, what redeployed.

## Behavioural rules

- **Always confirm before applying terraform or pushing images.** Production deploys are
  not reversible without effort. Show the components, the branch, and the SHA, and require
  explicit "y" before continuing.
- **Never use `--auto-approve`** unless the user explicitly asked for non-interactive mode.
- **Never push images tagged `latest` without also being prepared to roll back.** Mention
  to the user: rollback is `docker compose pull` of a previous tag, but only `:latest` is
  currently kept — so a bad release means rebuild from a previous git SHA. (No SHA-tagged
  images today; flag this as a risk if the user asks about rollback.)
- **Don't commit anything during /release.** If the user has uncommitted changes, surface
  them but let the user decide.
- **Honour aws-vault.** Every AWS-touching command must be wrapped in `aws-vault exec <profile> --`.
  If the profile isn't known yet, ask once at the start and reuse it.
- **One Bash message per logical batch.** Run independent steps (e.g. multiple image
  builds, output fetches) in parallel within a single response.

## Failure modes to handle

- `terraform apply` lock contention: surface the error verbatim and point the user to the
  force-unlock command in the README. Do NOT auto force-unlock.
- ECR login expired: re-run the login step once and retry.
- Image push fails with manifest error: usually a platform mismatch (Apple Silicon building
  arm64). Force `--platform linux/amd64`.
- `start.sh` reports migration failure: show the failure log, do NOT retry blindly. Stop
  and ask the user.
