#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ec2-user/element-armory"
ENV_FILE="${APP_DIR}/.env"
COMPOSE_FILE="${APP_DIR}/docker-compose.yml"
RENDERED_COMPOSE_FILE="${APP_DIR}/docker-compose.rendered.yml"
LOG_DIR="${APP_DIR}/logs"
LOG_FILE="${LOG_DIR}/deploy.log"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    log "ERROR: required file missing: $path"
    exit 1
  fi
}

log "Starting Element Armory deployment."

require_file "$ENV_FILE"
require_file "$COMPOSE_FILE"

cd "$APP_DIR"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${AWS_REGION:-}" || -z "${ECR_REGISTRY:-}" ]]; then
  log "ERROR: AWS_REGION and ECR_REGISTRY must be present in $ENV_FILE"
  exit 1
fi

log "Logging into ECR registry $ECR_REGISTRY."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

log "Rendering docker compose with env substitutions."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config > "$RENDERED_COMPOSE_FILE"

log "Pulling latest images before restart."
docker compose --env-file "$ENV_FILE" -f "$RENDERED_COMPOSE_FILE" pull

log "Running database migrations (one-shot app container)."
if ! docker compose --env-file "$ENV_FILE" -f "$RENDERED_COMPOSE_FILE" run --rm \
  -e PGSSLMODE=verify-full \
  app npm run migrate:prod; then
  log "ERROR: Migrations failed. Deployment aborted; existing containers unchanged."
  exit 1
fi
log "Migrations completed successfully."

log "Applying updated stack with minimal downtime."
docker compose --env-file "$ENV_FILE" -f "$RENDERED_COMPOSE_FILE" up -d --remove-orphans

log "Pruning dangling images."
docker image prune -f

log "Deployment complete."
