#!/bin/bash

echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo -e "\033[1;37mStopping Docker environment\033[0m"
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
echo ""

if docker compose -f ./docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
  echo -e "\x1B[32mStopping containers...\033[0m"
  docker compose -f ./docker-compose.yml down --remove-orphans
  echo ""
  echo -e "\033[1;37mEnvironment stopped.\033[0m"
else
  echo -e "\033[0;33mNo Docker environment is running.\033[0m"
fi

# Remove the network if it was created by start.sh
docker network rm copy-element-env &> /dev/null || true

echo ""
echo -e "\033[1;37m---------------------------------------------------------\033[0m"
