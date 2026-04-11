#!/bin/bash
BASEDIR=$PWD

echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo -e "\033[1;37mWelcome to the START script!\033[0m"
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo ""

# ── Stop existing containers ─────────────────────────────────────────────────

if docker compose -f ./docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
  echo -e "\033[0;33mStopping existing Docker environment\033[0m"
  docker compose -f ./docker-compose.yml kill &> /dev/null
else
  echo -e "\033[0;33mNo existing Docker environment running\033[0m"
fi

# ── Start containers ─────────────────────────────────────────────────────────

docker network create element-armory-env &> /dev/null

docker compose -f ./docker-compose.yml up -d --remove-orphans

if [ $? -ne 0 ]; then
  echo -e "\033[0;31mFailed to start. Check your .env file and Docker setup.\033[0m"
  exit 1
fi

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "\033[1;37mEnvironment running\033[0m"
echo ""
echo -e "  Website:  \033[1;36mhttp://localhost:${WEBSITE_PORT:-9900}\033[0m"
echo -e "  Admin:    \033[1;36mhttp://localhost:${ADMIN_PORT:-9920}\033[0m"
echo -e "  API:      \033[1;36mhttp://localhost:${SERVER_PORT:-8840}\033[0m"
echo ""
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
