---
title: Stabilize prod EC2 and move auto-blogger to host-level systemd timers
status: Planned
created: 2026-05-14
owner: matt
area: cross-cutting
tags: [infra, migration, perf]
---

# Stabilize prod EC2 and move auto-blogger to host-level systemd timers

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

> Status colours: `Planned` blue, `In progress` yellow, `Completed` brightgreen, `On hold` orange, `Deprecated` red. Update the badge alongside the front-matter `status` field.

## Context

Production runs on a single `t3.micro` EC2 (1 vCPU, 1 GB RAM, x86_64) hosting five containers via `terraform/templates/docker-compose.prod.yml`: `nginx`, `app` (Node server + SQLite + Better Auth), `mcp`, `auto-blogger`, and the OS. The box crashes roughly daily.

Two root causes stack:

1. **OOM kills.** No `mem_limit` on any container, no swap on the host, 1 GB RAM is insufficient for four resident Node processes. The kernel kills containers; `restart: unless-stopped` flaps them; the box sometimes wedges.
2. **CPU credit exhaustion.** `auto-blogger` runs as a permanent daemon (`AUTO_BLOG_MODE=daemon`, `DAILY_ARTICLES=4`, `AUTO_BLOG_NEWS_CYCLE_ENABLED=true` — see `auto-blogger/src/index.ts` `runDaemon`) with continuous topic + news loops. Each cycle calls Anthropic/Gemini, pushing CPU well above the `t3.micro` 10 % baseline and draining burst credits. Once credits hit zero, the whole stack is throttled to baseline and goes unresponsive.

The fix is two-step. First, give the box headroom (swap + per-container memory caps). Second, retire the resident auto-blogger daemon by running it as one-shot containers fired by host-level `systemd` timers — no extra compute cost, no Lambda, no second instance.

## Requirements & constraints

- **REQ-001** Prod EC2 runs ≥ 7 consecutive days without an OOM-related crash or status-check failure.
- **REQ-002** Auto-blogger continues to publish topic articles at the existing daily cadence after migration (no missed days, no duplicate articles).
- **REQ-003** News-cycle post continues to land once per day at `AUTO_BLOG_NEWS_CYCLE_HOUR` (Sydney).
- **REQ-004** Auto-blogger has no resident process on the EC2 web instance — only one-shot containers fired by `systemd` timers.
- **REQ-005** State (`/data/auto-blogger-state.json`) and lock (`/data/auto-blogger.lock`) continue to function across one-shot runs.
- **REQ-006** All deployment of code + infra changes flows through existing channels: GitHub Actions for image builds (`.github/workflows/deploy-apps.yml`), `terraform apply` for infra/runtime config.
- **CON-001** No Lambda, no Fargate. Compute must stay on the existing EC2 host (or, as fallback only, a separate tiny EC2 — not in this plan's primary path).
- **CON-002** No additional managed services (no MQ, no Step Functions, etc.) — pure host-level scheduling.
- **CON-003** Instance remains x86_64 (`terraform/ec2.tf` AMI filter is locked to `ami-04b4a6abf17562d1a`).
- **CON-004** No T3 Unlimited credits (decision: avoid surprise cost; rely on swap + mem limits + daemon removal).
- **CON-005** Observability stays at default EC2 metrics only (no CloudWatch agent in this plan).
- **GUD-001** Honour root `CLAUDE.md` Global Coding Standards: TypeScript only, named exports, no `any`, files < 300 lines, functional React (N/A here — server/CLI only).
- **GUD-002** All date-time fields persisted to disk use epoch ms (lock + state files already comply).
- **PAT-001** Follow the existing `aws_ssm_association` pattern in `terraform/ec2.tf` (`upload_runtime_env`, `upload_runtime_config`, `run_deployment`) for any new host file deployment.
- **PAT-002** ECR image pull pattern from `terraform/scripts/start.sh` (aws-cli `ecr get-login-password | docker login`) is the canonical login flow — reuse it inside the systemd unit.
- **SEC-001** Env files on host (`/home/ec2-user/element-armory/.env.auto-blogger`) remain `chmod 600` owned by `ec2-user`.
- **SEC-002** systemd unit runs as `ec2-user`, not root. Docker socket access already granted via group membership.

## References

- Internal docs: `./CLAUDE.md` (root), `./server-setup.md`, `terraform/README.md`
- Source files inspected: `auto-blogger/src/index.ts`, `auto-blogger/src/config.ts`, `auto-blogger/src/scheduler.ts`, `auto-blogger/src/newsSearch.ts`, `auto-blogger/src/lock.ts`, `auto-blogger/src/state.ts`, `terraform/ec2.tf`, `terraform/scripts/start.sh`, `terraform/scripts/user-data.sh`, `terraform/templates/docker-compose.prod.yml`, `terraform/variables/prod.tfvars`, `.github/workflows/deploy-apps.yml`
- Related plans: none currently in `./plans/active/`
- External docs: [systemd.timer](https://www.freedesktop.org/software/systemd/man/systemd.timer.html), [Docker Compose-spec mem_limit](https://github.com/compose-spec/compose-spec/blob/main/spec.md#mem_limit)

## Active plans affected

None.

## Docs to update on completion

- `terraform/README.md` — document the systemd timer install path and how to inspect timer status via `systemctl list-timers`.
- Root `CLAUDE.md` — add a one-line note under **Database Conventions** / a new **Scheduled jobs** subsection pointing at the systemd timer pattern so future cron-style work uses the same approach.
- `auto-blogger/README.md` — update the "how this runs in prod" section: no longer a daemon, fired by systemd timers; `AUTO_BLOG_TARGET` now accepts `topics | news`.
- Inline comment in `terraform/templates/docker-compose.prod.yml` explaining why `auto-blogger` is intentionally absent.

## Data & API design

No DB or API changes. The auto-blogger writes artifacts to S3 and sends notification emails via SES — both paths are unchanged. State and lock files remain on the bind-mounted `/data` directory.

## Architecture decisions

- **DEC-001 — Cadence lives in systemd timer files, not in TS code.** `scheduler.ts` is not refactored. Rejected: refactoring `scheduler.ts` to a fixed 2-hour anchor — would be dead code once the daemon is gone. Daemon mode is left intact for local dev only.
- **DEC-002 — `AUTO_BLOG_TARGET` is extended to `"topics" | "news"`.** `main()` in `auto-blogger/src/index.ts` branches on target when `mode !== "daemon"`. Rejected: adding a `--news` CLI flag (introduces a new convention) and a parallel `AUTO_BLOG_RUN_KIND` env var (redundant with existing var).
- **DEC-003 — Fixed daily schedule `09:30, 11:30, 13:30, 15:30` Sydney (no randomness).** News post at `${AUTO_BLOG_NEWS_CYCLE_HOUR}:00`. Rejected: random anchor recomputed at midnight (extra timer, more moving parts) and `09:30` fixed but minute jittered (loses determinism without real benefit).
- **DEC-004 — `mem_limit` in compose uses top-level service key, not `deploy.resources.limits.memory`.** The latter is honoured only by Swarm / `docker stack`, not by `docker compose up` outside Swarm mode. The current prod compose has no `version:` key (compose-spec), where `mem_limit` is a first-class field.
- **DEC-005 — Host-level systemd timers on the existing EC2, not a separate nano instance.** Zero extra cost. Fallback (separate `t3.nano`) is documented under Risks for the case where the web app keeps starving even after Phase 2.
- **DEC-006 — Skip T3 Unlimited mode.** Decision driven by cost predictability. If CPU credit alarms persist after Phase 2 lands, revisit.
- **DEC-007 — Skip RSS cache.** `fetchNewsItems` is called once per day total; an on-disk cache adds complexity for no measurable benefit in one-shot mode.
- **DEC-008 — Skip CloudWatch agent / custom metrics.** Free EC2 metrics (CPU, network, status checks, credit balance, credit usage) are sufficient to verify the acceptance criterion. Memory visibility is achievable via SSH + `free -h` during the soak.
- **DEC-009 — `Persistent=true` on every timer.** Missed slots after reboot / instance stop are caught up on next boot. Combined with the lock file, this prevents both "missed day" and "double-publish" failure modes.
- **DEC-010 — Image pull on every timer fire.** ExecStartPre runs `aws ecr get-login-password | docker login` then `docker pull`. Adds ~5 s to each run, removes the need for a separate update mechanism. The GitHub Actions deploy already pushes `:latest`; the next timer fire picks it up.

## Phases

### Phase 1 — Stabilize the running instance

**Goal (GOAL-001):** Stop the daily crashes immediately by adding swap and per-container memory limits. No code changes. No auto-blogger architecture change yet.

| Task     | Description                                                                                                                                                                                                                                          | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-101 | Edit `terraform/scripts/user-data.sh` to add an idempotent swap block: if `/swapfile` does not exist, `fallocate -l 4G /swapfile`, `chmod 600`, `mkswap`, `swapon`, append to `/etc/fstab`, set `vm.swappiness=10` in `/etc/sysctl.d/99-swap.conf`. |      |      |
| TASK-102 | Add a new `aws_ssm_association` (e.g. `apply_swap`) in `terraform/ec2.tf` that runs the same swap-install commands inline so the live instance gets swap without a relaunch. Idempotent — guarded by `[ -f /swapfile ]`.                              |      |      |
| TASK-103 | Edit `terraform/templates/docker-compose.prod.yml`: add `mem_limit` and `memswap_limit` to `nginx` (`64m` / `128m`), `app` (`512m` / `768m`), `mcp` (`256m` / `384m`), `auto-blogger` (`384m` / `512m`). Top-level service keys, not under `deploy.`. |      |      |
| TASK-104 | Add inline comment in compose template noting the budget is sized for a 1 GB + 4 GB swap box and that auto-blogger will be removed in Phase 2.                                                                                                       |      |      |
| TASK-105 | `terraform apply` via the existing `/release terraform-only` flow. The `apply_swap` SSM association runs on the live instance; the `run_deployment` association restarts the stack with the new compose template.                                    |      |      |
| TASK-106 | Verify on the host: `free -h` shows 4 GB swap, `docker stats --no-stream` shows the limits applied, `systemctl status docker` is active.                                                                                                             |      |      |
| TASK-107 | Confirm the deployment-time migration step (`start.sh` `npm run migrate:prod` under `mem_limit: 512m`) succeeds without OOM. Inspect `journalctl` / `/home/ec2-user/element-armory/logs/deploy.log`. If the migration consumes > 400 MiB, bump `app` cap to `640m` before proceeding to Phase 2. |      |      |
| TASK-108 | **48-hour soak** between Phase 1 and Phase 2 terraform applies. AC-001..004 must hold for the swap+limits change in isolation before retiring the daemon — otherwise we lose the ability to attribute later regressions. |      |      |

**Files touched (FILE-…):**
- `terraform/scripts/user-data.sh` — swap install block
- `terraform/ec2.tf` — new `aws_ssm_association.apply_swap`
- `terraform/templates/docker-compose.prod.yml` — `mem_limit` / `memswap_limit` per service

**Tests added in this phase:** none (infra-only).

**Verify:**
- `ssh ec2-user@<eip> free -h` shows `Swap: 4.0Gi`.
- `ssh ec2-user@<eip> cat /etc/fstab | grep swapfile` present.
- `ssh ec2-user@<eip> sysctl vm.swappiness` returns `10`.
- `ssh ec2-user@<eip> docker inspect element-armory-app --format '{{.HostConfig.Memory}}'` returns `536870912` (512 MiB) — repeat for the others.
- 48-hour soak: no status-check failures, no `OOMKilled` events in `docker events` log.

### Phase 2 — Move auto-blogger to host-level systemd timers

**Goal (GOAL-002):** Remove the resident auto-blogger daemon entirely; replace it with one-shot Docker runs fired by systemd timers at deterministic times. Done atomically inside a single `terraform apply` so there is no period where the stack has both or neither.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Done | Date |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-201 | `auto-blogger/src/config.ts`: change `target: "topics"` field type to `target: "topics" \| "news"`. Add validation in `loadConfig` matching the existing `mode` check.                                                                                                                                                                                                                                                                                                                  |      |      |
| TASK-202 | `auto-blogger/src/index.ts` `main()`: when `config.mode !== "daemon"`, branch on `config.target` — `"topics"` calls `runSingleCycle` (current behaviour), `"news"` calls `runNewsCycle`. Daemon path untouched (dev only).                                                                                                                                                                                                                                                              |      |      |
| TASK-203 | Acquire lock in both one-shot paths. Currently the daemon does not acquire `lockPath` either, but for one-shot we need it. Wrap `runSingleCycle` and `runNewsCycle` invocations in `main()` with `acquireLock(config.lockPath)` + `finally { lock.release() }`. Lock is PID-based and stale-cleared in `auto-blogger/src/lock.ts:21`, safe under timer races.                                                                                                                            |      |      |
| TASK-204 | Add `auto-blogger.service.tftpl` and per-target `.timer.tftpl` files to a new `terraform/templates/systemd/` directory:<br>• `auto-blogger@.service.tftpl` — templated unit, `%i` is the systemd target (`topics` / `news`). **Important:** `ECR_REGISTRY`, `ECR_AUTO_BLOGGER_REPO`, `AWS_REGION` must be resolved at **terraform render time** via `templatefile()` (these vars live in `.env.server`, not `.env.auto-blogger`, so they cannot be sourced by the unit at runtime). After rendering, the unit file in `/etc/systemd/system/` must contain literal values with no `${...}` placeholders left. `ExecStartPre`: ECR login + `docker pull <literal-registry>/<literal-repo>:latest`. `ExecStart`: `docker run --rm --env-file /home/ec2-user/element-armory/.env.auto-blogger -e AUTO_BLOG_TARGET=%i -e AUTO_BLOG_MODE=once -v /home/ec2-user/element-armory/data:/data <literal-registry>/<literal-repo>:latest`. `User=ec2-user`. `Type=oneshot`. Confirm `auto-blogger/Dockerfile` `ENTRYPOINT`/`CMD` runs `node dist/index.js` so `docker run` with no extra args triggers `main()`. |      |      |
| TASK-205 | `auto-blogger-topics.timer` — `OnCalendar=*-*-* 09:30,11:30,13:30,15:30 Australia/Sydney`. `Unit=auto-blogger@topics.service`. `Persistent=true`.                                                                                                                                                                                                                                                                                                                                       |      |      |
| TASK-206 | `auto-blogger-news.timer` — `OnCalendar=*-*-* 10:00 Australia/Sydney` (or `${AUTO_BLOG_NEWS_CYCLE_HOUR}:00` rendered by terraform from the var). `Unit=auto-blogger@news.service`. `Persistent=true`.                                                                                                                                                                                                                                                                                   |      |      |
| TASK-207 | Add a new `aws_ssm_association.install_auto_blogger_timers` in `terraform/ec2.tf`. It writes the three unit files to `/etc/systemd/system/`, runs `systemctl daemon-reload`, `systemctl reset-failed auto-blogger-*` (clears any prior failed-unit state across reapplies), then `systemctl enable --now auto-blogger-topics.timer auto-blogger-news.timer`. Idempotent (`systemctl enable` is idempotent; file writes overwrite). Drive the install via a new bool variable `enable_auto_blogger_timers` (default `true`) so rollback can flip it to `false` and the association will instead `systemctl disable --now` + remove the unit files. |      |      |
| TASK-208 | Update `terraform/ec2.tf` locals: render `auto-blogger@.service.tftpl` via `templatefile()` passing `ecr_registry`, `ecr_auto_blogger_repo`, `aws_region`. Render `auto-blogger-news.timer.tftpl` via `templatefile()` passing `news_cycle_hour`. Render `auto-blogger-topics.timer.tftpl` (no interpolation needed — pure `file()` works). Match the existing render idiom used for `docker-compose.prod.yml`. |      |      |
| TASK-209 | Remove the `auto-blogger` service block from `terraform/templates/docker-compose.prod.yml`. Replace with a one-line comment: `# auto-blogger runs as systemd one-shot timers, not as a compose service. See terraform/templates/systemd/.`.                                                                                                                                                                                                                                              |      |      |
| TASK-210 | Add `depends_on = [aws_ssm_association.upload_runtime_env, aws_ssm_association.upload_runtime_config, aws_ssm_association.run_deployment]` to the new `install_auto_blogger_timers` association. The compose-down (auto-blogger leaves) happens during `run_deployment` (which re-runs `start.sh`); the timer install runs immediately after, guaranteeing zero overlap and a ≤ 60 s gap.                                                                                                  |      |      |
| TASK-211 | Sanity-check `.env.auto-blogger`: `AUTO_BLOG_MODE` is no longer set by the unit (the unit passes `-e AUTO_BLOG_MODE=once` explicitly), so remove or comment the `AUTO_BLOG_MODE=daemon` line in `terraform/ec2.tf`'s `auto_blogger_env_file` local. Likewise remove `AUTO_BLOG_NEWS_CYCLE_ENABLED` (no longer consulted in one-shot mode).                                                                                                                                                  |      |      |
| TASK-212 | Commit the code change (TASK-201–203) to master so GitHub Actions `.github/workflows/deploy-apps.yml` builds and pushes the new `element-armory-auto-blogger:latest` image **before** the terraform apply. The workflow's `paths` filter already covers `auto-blogger/**`.                                                                                                                                                                                                              |      |      |
| TASK-213 | `terraform apply` to roll out the compose change + the new timer association in one step.                                                                                                                                                                                                                                                                                                                                                                                              |      |      |
| TASK-214 | On the host: `systemctl list-timers --all auto-blogger-*` shows both timers with sensible NEXT times. `journalctl -u auto-blogger@topics.service --since '1h ago'` after the first slot shows a successful run.                                                                                                                                                                                                                                                                         |      |      |

**Files touched (FILE-…):**
- `auto-blogger/src/config.ts` — extend `target` type union, add validation
- `auto-blogger/src/index.ts` — branch on `target` in `main()`, wrap one-shot paths in `acquireLock`
- `terraform/templates/systemd/auto-blogger@.service` — new templated unit
- `terraform/templates/systemd/auto-blogger-topics.timer` — new
- `terraform/templates/systemd/auto-blogger-news.timer` — new (templated for news hour)
- `terraform/ec2.tf` — new `aws_ssm_association.install_auto_blogger_timers`, render templates, remove `AUTO_BLOG_MODE` from `auto_blogger_env_file`
- `terraform/templates/docker-compose.prod.yml` — remove `auto-blogger` service

**Tests added in this phase:**
- Unit test in `auto-blogger/` covering `AUTO_BLOG_TARGET=news` config parsing (extend existing `quality.test.ts` style or add `config.test.ts`).
- Manual integration test (host): trigger `systemctl start auto-blogger@topics.service` out of cycle and confirm article lands in S3.

**Verify:**
- `systemctl list-timers --all auto-blogger-*` shows two timers; NEXT timestamps match `09:30/11:30/13:30/15:30 Sydney` and the news hour.
- `docker ps` no longer shows `element-armory-auto-blogger`.
- `journalctl -u auto-blogger@topics.service -f` during the next scheduled slot: ExecStartPre logs into ECR, pulls image, ExecStart runs container, container exits 0.
- S3 `auto-blog` bucket receives a new `pending/...` artifact within 5 min of the slot.
- 7-day soak: no missed publication days, no duplicate publishes (audit `processedSlugs` in `/data/auto-blogger-state.json`), no EC2 status-check failures, CPU credit balance trends positive.

## Alternatives considered

- **ALT-001 — Separate dedicated `t3.nano` for auto-blogger.** Full isolation, ~$3.50/mo. Rejected as primary in favour of Option C (host-level timers) on cost grounds; kept as documented fallback if the web instance is still starved after Phase 2.
- **ALT-002 — Fargate scheduled task via EventBridge.** Pay-per-second compute, no instance to patch. Rejected per `CON-001` (no Lambda/Fargate).
- **ALT-003 — `scheduler.ts` refactor to 2h anchor.** Useful only if the daemon is retained. Daemon is being retired in Phase 2, so the refactor is dead code.
- **ALT-004 — RSS cache layer.** Future-proofs against per-feed expansion but provides ~0 benefit with one-shot, once-daily news invocation. Skip.
- **ALT-005 — T3 Unlimited credits.** Bounded but real recurring cost; not needed if Phase 2 lands cleanly.
- **ALT-006 — CloudWatch agent for memory + custom alarms.** Worth doing eventually; out of scope here to keep the change small. Free EC2 metrics + manual `free -h` during soak are sufficient for acceptance verification.

## Dependencies

- **DEP-001** AWS SSM permissions on the EC2 instance profile already include `AmazonSSMManagedInstanceCore` (per `aws_iam_role_policy_attachment.ec2_ssm_managed` in `terraform/iam.tf`).
- **DEP-002** `aws-cli` is installed in user-data (`terraform/scripts/user-data.sh:6`). ECR login from the systemd unit uses the instance profile via IMDSv2 — already configured (`metadata_options.http_put_response_hop_limit = 2` in `terraform/ec2.tf:160`).
- **DEP-003** `docker compose v2` plugin is installed in user-data — unchanged.
- **DEP-004** GitHub Actions workflow `.github/workflows/deploy-apps.yml` already builds and pushes `element-armory-auto-blogger:latest` on `auto-blogger/**` changes. No workflow edits needed.

## Testing strategy

- **Unit:** add a small test for the extended `AUTO_BLOG_TARGET` union and the `mode !== "daemon"` branching in `main()`. The auto-blogger already uses node:test or vitest (see `auto-blogger/src/quality.test.ts`).
- **Integration:** run a one-shot Docker invocation locally with `AUTO_BLOG_TARGET=news AUTO_BLOG_MODE=once AUTO_BLOG_DRY_RUN=true` and verify a news artifact is emitted.
- **Manual (host) — required:** after `terraform apply`, manually fire `sudo systemctl start auto-blogger@topics.service` to validate ECR login + pull + run end-to-end without waiting for the next slot. **Verify (human):** required because the test exercises the live ECR + S3 + SES path.
- **Soak:** 7-day observation against the acceptance criteria below. No automation — manual once per day.

## Acceptance criteria

- **AC-001** Zero EC2 status-check failures for 7 consecutive days after Phase 2 lands.
- **AC-002** `docker events --since 7d` on the host shows zero `OOMKilled` events for `nginx`, `app`, `mcp`.
- **AC-003** CPU credit balance (CloudWatch metric `CPUCreditBalance`) never falls below 30 over the 7-day window. Visible in the EC2 console.
- **AC-004** `free -h` reports ≥ 200 MiB free RAM at any idle moment during the soak.
- **AC-005** Auto-blogger publishes the expected number of topic articles per day (per `DAILY_ARTICLES` env value, matches timer slot count) and one news post.
- **AC-006** Zero duplicate `slug` entries in `/data/auto-blogger-state.json` `processedSlugs`.

## Code-quality principles applied

- **Server:** N/A (no server changes).
- **DB:** N/A (no DB changes). Lock file + state file already use epoch ms via `Date.now()`.
- **TS:** named exports, no `any`, files remain < 300 lines (`config.ts` and `index.ts` are already inside the budget and grow by < 20 lines).
- **Errors:** systemd `Restart=on-failure` is intentionally **not** set on the `.service` — a single one-shot failure should not retry indefinitely; the next timer fire will pick up. If consistent failures occur, alarms (out of scope) flag it.
- **Infra:** terraform changes follow the existing `aws_ssm_association` pattern. No new IAM. No new secrets. No new networking.

## Risks & assumptions

- **RISK-001 — Timer fires while previous run still active.** Mitigation: per-target lock file (PID-based, stale-cleared after process exit). A run that overshoots its 2-hour window into the next slot is naturally serialised.
- **RISK-002 — ECR login race.** The unit `ExecStartPre` logs in fresh on every fire; tokens are 12 h, far longer than the run. No race expected.
- **RISK-003 — Image pull failure on a single fire** (transient network / ECR throttling). That slot is lost; `Persistent=true` does not retry within the same day. Acceptable — `processedKeywordIds` won't advance, the missed slot effectively shifts the queue.
- **RISK-004 — Compose change + timer install land out of order during `terraform apply`.** Mitigation via `depends_on` chain (`run_deployment` → `install_auto_blogger_timers`). Worst case: ~60 s window where neither path runs; outside the scheduled slots that's invisible.
- **RISK-005 — `mem_limit` too tight, OOM-kills `app` under load.** Mitigation: 4 GB swap absorbs spikes; budget is conservative (`app=512m`); revisit if `docker events` shows `oom-kill` post-deploy. Easy to bump.
- **RISK-006 — Web app continues to starve even with auto-blogger gone.** Mitigation: ALT-001 (separate `t3.nano`) is documented; cutover is a single terraform variable + new IAM role; ~30 min work.
- **ASSUMPTION-001** The `/release auto-blogger` skill rebuilds and pushes the image even though it's no longer referenced in compose. Skill is `docker build` + `docker push` to ECR; compose has no part in the build path. **Verify once during Phase 2** by running `/release auto-blogger`.
- **ASSUMPTION-002** `Australia/Sydney` is the desired publishing timezone. `auto-blogger/src/config.ts:131` defaults to it; confirm by inspecting `.env.auto-blogger` on the host or accept the default.
- **ASSUMPTION-003** `DAILY_ARTICLES=4` will not be raised above 4 without revisiting the timer schedule (currently exactly four slots).

## Out of scope

- T3 Unlimited credit mode.
- CloudWatch agent installation, custom metrics, alarm configuration.
- RSS cache layer in `newsSearch.ts`.
- `scheduler.ts` code refactor.
- Migrating auto-blogger to a separate EC2 instance (fallback only).
- Any change to `app`, `mcp`, `nginx`, `website`, `admin`, `chrome-extension`, `figma-plugin`.
- DB schema changes.
- Better Auth, Stripe, SES configuration changes.

---

## Applying this to production

### Deployment paths in this repo (recap)

| Change type | Channel | Triggered by |
|-------------|---------|--------------|
| Code in `server/**`, `mcp-server/**`, `auto-blogger/**` | GitHub Actions — `.github/workflows/deploy-apps.yml` | `push` to `master` matching the workflow's `paths` filter |
| `terraform/scripts/start.sh` | GitHub Actions — `deploy-apps.yml` syncs via SSM | same push |
| `terraform/templates/docker-compose.prod.yml` | GitHub Actions — `deploy-apps.yml` triggers `start.sh` which re-pulls the rendered compose | same push, **but** the rendered file is produced by `terraform apply` (`aws_ssm_association.upload_runtime_config`). Pure template changes therefore **require a `terraform apply`** to take effect. |
| Any `terraform/**` file *except* `scripts/start.sh` and `templates/docker-compose.prod.yml` | `terraform apply` — manual | the `/release terraform-only` skill, or `aws-vault exec <profile> -- docker compose run --rm terraform apply` inside `terraform/` |
| Website (`website/**`) | GitHub Actions — `.github/workflows/deploy-website.yml` | push to `master` |
| Admin (`admin/**`) | GitHub Actions — `.github/workflows/deploy-admin.yml` | push to `master` |

### Roll-out sequence for this plan

The cutover requires **two commits** and **two `terraform apply` runs** with a 48-hour soak between them. **Do not collapse the two applies into one** — Phase 1 must be validated in isolation so any later regression can be attributed cleanly. Order:

1. **Commit 1 — Phase 1 infra only.** Land TASK-101/102/103/104 (swap user-data block, `apply_swap` SSM association, compose `mem_limit`s) on `master`.
   - GitHub Actions `deploy-apps.yml` will fire because `paths` matches `terraform/templates/docker-compose.prod.yml`. The host's compose file is still the old terraform-rendered version, so the GHA-triggered `start.sh` run is effectively a no-op for the mem-limit change — expected.
   - Immediately run **`terraform apply` #1** via `/release terraform-only`:
     - `apply_swap` SSM association → 4 GB swap live on the running instance.
     - `upload_runtime_config` → new compose template (with `mem_limit`s, **auto-blogger still present**) lands.
     - `run_deployment` → `start.sh` re-runs → `docker compose up -d` restarts the stack under the new limits.
   - Run TASK-106, TASK-107 immediately. If migration fails under the 512 MiB cap, bump `app` to `640m`, re-apply, re-verify.

2. **48-hour soak (TASK-108).** Watch EC2 status checks, `CPUCreditBalance`, `free -h`, `docker events` for OOM-kills. AC-001..004 must hold. If they don't, do not proceed — diagnose first.

3. **Commit 2 — code change for one-shot news invocation.** Land TASK-201/202/203 (`auto-blogger/src/config.ts`, `auto-blogger/src/index.ts`) on `master`.
   - GitHub Actions builds and pushes the new `element-armory-auto-blogger:latest`. The running daemon will pick up the new image on next `start.sh` cycle; daemon behaviour is unchanged because the new branches require `AUTO_BLOG_MODE=once`, which the daemon never sets.
   - **Validate** in Actions logs that the build succeeded and the new image digest is in ECR.

4. **Commit 3 — Phase 2 infra (timer install + compose removal).** Land TASK-204/205/206/207/208/209/210/211 on `master`.
   - GHA fires again, no-ops as before on the not-yet-applied template.
   - Run **`terraform apply` #2** via `/release terraform-only`:
     - `upload_runtime_env` → updated `.env.auto-blogger` (without `AUTO_BLOG_MODE=daemon` / `AUTO_BLOG_NEWS_CYCLE_ENABLED`).
     - `upload_runtime_config` → new compose template **without** `auto-blogger`. Plus a separate SSM step writes the rendered systemd unit + timer files to `/etc/systemd/system/`.
     - `run_deployment` → `start.sh` runs `docker compose up -d --remove-orphans` → existing `element-armory-auto-blogger` container is stopped and removed.
     - `install_auto_blogger_timers` (gated by `depends_on = [run_deployment]`) → `daemon-reload`, `reset-failed auto-blogger-*`, `enable --now` the two timers.
   - Order guarantees: daemon is killed before timers are armed, with ≤ 60 s of no-coverage; outside the scheduled slots that window is invisible.

5. **Post-apply manual validation** (one engineer, ~15 min):
   - SSH (or SSM Session Manager) and run the Phase 2 *Verify* checklist.
   - Trigger `sudo systemctl start auto-blogger@topics.service` once out of cycle to prove ECR login + pull + run end-to-end. Tail `journalctl -u auto-blogger@topics.service -f`.
   - Confirm a new artifact lands in S3 (`auto-blog` bucket, `auto-blogger/pending/`).

6. **7-day soak.** Daily check: EC2 status checks, `CPUCreditBalance`, `free -h`, `docker stats --no-stream`, `systemctl list-timers auto-blogger-*`, `journalctl -u 'auto-blogger@*' --since '24h ago' | grep -E 'Failed|error'`. If AC-001..006 hold, move the plan to `./plans/complete/` via `/plan-done`.

### Rollback

Two scenarios:

- **Roll back Phase 2 only (most likely):** flip `enable_auto_blogger_timers = false` in `terraform/variables/prod.tfvars`, then `git revert` the Phase 2 commit (compose template change). Run `terraform apply`. The `install_auto_blogger_timers` association takes the disable branch (`systemctl disable --now auto-blogger-topics.timer auto-blogger-news.timer` + remove the unit files); the reverted compose template restores `auto-blogger` as a daemon. Swap + `mem_limit`s stay (harmless).
- **Full rollback to pre-Phase-1:** in addition to the above, `git revert` the Phase 1 commit and `terraform apply`. Swap survives a single apply (file already exists, idempotent guard short-circuits), so a separate manual `swapoff /swapfile && rm /swapfile && sed -i '/swapfile/d' /etc/fstab` over SSM is needed if you want a truly clean reverse — almost never necessary.

### Notes on the `/release` skill

`/release terraform-only` is the lightest path for step 3 — it runs `terraform apply` without rebuilding any images. Use it once code changes from step 1 have been verified live. Do **not** run `/release auto-blogger` to ship code changes; commit-and-push (step 1) is the canonical path because it's what triggers the GitHub Actions build with the correct cache config.

## Architect notes

Architect subagent review run 2026-05-15. Verdict: **fix-blocking-then-ship → ship** (no BLOCKING issues; WARNINGS addressed inline above). Surviving observations the executing agent should keep in mind:

- **`AUTO_BLOG_MODE` default is already `"once"`** (`auto-blogger/src/config.ts:96`). The unit's `-e AUTO_BLOG_MODE=once` injection (TASK-204) is belt-and-braces, not load-bearing. Future maintainers reading the unit should not assume the implicit default is `daemon`.
- **No alerting for missed scheduled slots.** Per DEC-008 (no CloudWatch agent in this plan), a transient ECR pull failure (`RISK-003`) silently shifts the queue and the only signal is `journalctl` on the host. The 7-day soak's daily `journalctl … | grep Failed` check is the only mitigation. Consider a follow-up plan that wires a tiny CloudWatch metric filter on `journalctl` exports, or a SES self-report from the unit on non-zero exit.
- **`aws_ssm_association` re-run semantics on update.** Verified that updating `parameters.commands` causes SSM to re-run on next association schedule (the existing `upload_runtime_config` / `run_deployment` pattern relies on this and is known-working in this repo). No change required, but be aware: the first apply after a `parameters` edit may take 1–2 minutes to fire on the host.
- **Auto-blogger Dockerfile entrypoint confirmation** is gated into TASK-204. If the image's `CMD` requires explicit `npm run start` or `node dist/index.js` args, the `docker run` invocation in the service unit must include them.
