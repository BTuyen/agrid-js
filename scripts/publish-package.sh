#!/bin/bash

# Script helper để publish package lên npm
# Usage: ./scripts/publish-package.sh <package-name> [tag]

set -e

PACKAGE_NAME=$1
TAG=${2:-latest}

if [ -z "$PACKAGE_NAME" ]; then
    echo "❌ Error: Package name is required"
    echo "Usage: ./scripts/publish-package.sh <package-name> [tag]"
    echo "Example: ./scripts/publish-package.sh @agrid/core"
    echo "Example: ./scripts/publish-package.sh @agrid/core alpha"
    exit 1
fi

echo "📦 Publishing $PACKAGE_NAME with tag: $TAG"

# Kiểm tra đã login npm chưa
if ! npm whoami &> /dev/null; then
    echo "❌ Error: Not logged in to npm"
    echo "Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"

# Build package trước
echo "🔨 Building package..."
pnpm turbo --filter="$PACKAGE_NAME" build

# Kiểm tra version hiện tại
PACKAGE_PATH=$(pnpm list --filter="$PACKAGE_NAME" --json | jq -r '.[0].path')
CURRENT_VERSION=$(jq -r '.version' "$PACKAGE_PATH/package.json")
echo "📌 Current version: $CURRENT_VERSION"

# Kiểm tra version đã tồn tại chưa
if npm view "$PACKAGE_NAME@$CURRENT_VERSION" version &> /dev/null; then
    echo "⚠️  Warning: Version $CURRENT_VERSION already exists on npm"
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled"
        exit 1
    fi
fi

# Dry run
echo "🔍 Running dry-run..."
pnpm publish --filter="$PACKAGE_NAME" --tag="$TAG" --dry-run

# Xác nhận publish
read -p "Do you want to publish? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

# Publish
echo "🚀 Publishing to npm..."
pnpm publish --filter="$PACKAGE_NAME" --tag="$TAG"

echo "✅ Published successfully!"
echo "📦 Package: $PACKAGE_NAME@$CURRENT_VERSION"
echo "🏷️  Tag: $TAG"
echo "🔗 View at: https://www.npmjs.com/package/$PACKAGE_NAME"

