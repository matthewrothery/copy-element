#!/bin/bash
set -e

# One-time machine bootstrap only.
yum update -y
yum install -y docker aws-cli

# Install Docker Compose v2 plugin.
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

echo "element-armory machine setup completed at $(date)" >> /var/log/element-armory-setup.log
