#!/bin/bash
set -e

echo "[localstack-init] Creating S3 assets bucket..."
awslocal s3 mb s3://element-armory-assets-local

echo "[localstack-init] Applying CORS policy..."
awslocal s3api put-bucket-cors \
  --bucket element-armory-assets-local \
  --cors-configuration file:///etc/localstack/init/cors.json

echo "[localstack-init] Verifying SES domain identity..."
awslocal ses verify-domain-identity --domain localhost

echo "[localstack-init] Done."
