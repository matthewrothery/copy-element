#!/usr/bin/env bash
set -e

VERSION=$(node -p "require('./package.json').version")
DATE=$(date +%Y%m%d)
OUTFILE="releases/element-armory-v${VERSION}-${DATE}.zip"

mkdir -p releases

echo "Building production extension..."
npx vite build --config vite.prod.config.ts

echo "Creating zip: $OUTFILE"
cd dist && zip -r "../$OUTFILE" . && cd ..

echo "Done: $OUTFILE"
