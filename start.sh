#!/bin/bash
BASEDIR=$PWD

echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo -e "\033[1;37mWelcome to the START script!\033[0m"
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo ""

# ── AWS Vault ────────────────────────────────────────────────────────────────

if ! command -v aws-vault &> /dev/null; then
  echo -e "\033[0;31mError: aws-vault is not installed or not in PATH\033[0m"
  exit 1
fi

if [ -z "$AWS_VAULT_PROFILE" ]; then
  read -r -p "Enter AWS Vault profile name: " AWS_VAULT_PROFILE
fi

if [ -z "$AWS_VAULT_PROFILE" ]; then
  echo -e "\033[0;31mError: AWS Vault profile is required\033[0m"
  exit 1
fi

# ── Stop existing renewal daemon ─────────────────────────────────────────────

RENEWAL_PID_FILE="$BASEDIR/.aws-renewal.pid"
if [ -f "$RENEWAL_PID_FILE" ]; then
  OLD_PID=$(cat "$RENEWAL_PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo -e "\033[0;33mStopping credential renewal daemon (PID $OLD_PID)\033[0m"
    kill "$OLD_PID" 2>/dev/null
  fi
  rm -f "$RENEWAL_PID_FILE"
fi

# ── Stop existing containers ─────────────────────────────────────────────────

if docker compose -f ./docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
  echo -e "\033[0;33mStopping existing Docker environment\033[0m"
  docker compose -f ./docker-compose.yml kill &> /dev/null
else
  echo -e "\033[0;33mNo existing Docker environment running\033[0m"
fi

echo ""
echo -e "\x1B[32mStarting with AWS profile: $AWS_VAULT_PROFILE\033[0m"

# ── Start containers ─────────────────────────────────────────────────────────

docker network create element-armory-env &> /dev/null

aws-vault exec "$AWS_VAULT_PROFILE" -- \
  docker compose -f ./docker-compose.yml up -d --remove-orphans

if [ $? -ne 0 ]; then
  echo -e "\033[0;31mFailed to start. Check profile name and credentials.\033[0m"
  exit 1
fi

# ── Credential renewal daemon ─────────────────────────────────────────────────
# STS tokens from aws-vault expire after 1 hour by default.
# This daemon recreates the server container with fresh credentials every 55 minutes.

RENEWAL_INTERVAL=3300  # 55 minutes

(
  while true; do
    sleep $RENEWAL_INTERVAL
    echo -e "\033[0;33m[aws-renewal] Refreshing credentials for profile: $AWS_VAULT_PROFILE\033[0m"
    aws-vault exec "$AWS_VAULT_PROFILE" -- \
      docker compose -f ./docker-compose.yml up -d server 2>&1
    if [ $? -eq 0 ]; then
      echo -e "\x1B[32m[aws-renewal] Credentials refreshed\033[0m"
    else
      echo -e "\033[0;31m[aws-renewal] Refresh failed — server may lose AWS access\033[0m"
    fi
  done
) &

RENEWAL_PID=$!
echo "$RENEWAL_PID" > "$RENEWAL_PID_FILE"

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "\033[1;37mEnvironment running\033[0m"
echo ""
echo -e "  Website:  \033[1;36mhttp://localhost:${WEBSITE_PORT:-8888}\033[0m"
echo -e "  API:      \033[1;36mhttp://localhost:${SERVER_PORT:-8840}\033[0m"
echo ""
echo -e "  AWS Profile:  \033[1;36m$AWS_VAULT_PROFILE\033[0m"
echo -e "  Renewal PID:  \033[1;36m$RENEWAL_PID\033[0m (every $((RENEWAL_INTERVAL / 60))m)"
echo ""
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
