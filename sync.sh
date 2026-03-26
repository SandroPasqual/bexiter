#!/bin/bash

# Bexiter Sync Script
# Run: ./sync.sh "your commit message"

set -e

if [ -z "$1" ]; then
    echo "Usage: ./sync.sh \"your commit message\""
    exit 1
fi

echo "📦 Committing changes..."
git add .
git commit -m "$1"

echo "🚀 Pushing to GitHub..."
git push origin master

echo "🌐 Deploying to Vercel..."
npx vercel --prod --yes 2>/dev/null || echo "⚠️ Auto-deploy failed - check Vercel dashboard"

echo "✅ Done! Bexiter is synced:"
echo "   - Local: ✓"
echo "   - GitHub: ✓"
echo "   - Vercel: Deploying... (check vercel.app in ~1 min)"