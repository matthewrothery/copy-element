#!/bin/bash
BASEDIR=$PWD

echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo -e "\033[1;37mWelcome to the START script!\033[0m"
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo ""

# Check if existing docker environment is running
if docker compose -f ./docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
  echo -e "\033[0;33mExisting Docker environment is running.\033[0m"
  echo -e "\033[0;33mStopping existing docker environment\033[0m"
  docker compose -f ./docker-compose.yml kill &> /dev/null
else
  echo -e "\033[0;33mNo existing Docker environment is running.\033[0m"
fi

echo ""
echo -e "\x1B[32mStarting docker environment\033[0m"

# Create the docker network
docker network create copy-element-env &> /dev/null

# Start the docker containers
docker compose -f ./docker-compose.yml up -d --remove-orphans

echo ""
echo -e "\033[1;37mEnvironment running\033[0m"
echo ""
echo -e "  Website:  \033[1;36mhttp://localhost:${WEBSITE_PORT:-80}\033[0m"
echo -e "  API:      \033[1;36mhttp://localhost:${SERVER_PORT:-8840}\033[0m"
echo ""
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
