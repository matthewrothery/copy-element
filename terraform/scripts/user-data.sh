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

# Swap — 4 GB swapfile to absorb memory spikes on the 1 GB t3.micro.
# Idempotent: skip if /swapfile already exists.
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf
  sysctl -p /etc/sysctl.d/99-swap.conf
fi

echo "element-armory machine setup completed at $(date)" >> /var/log/element-armory-setup.log
