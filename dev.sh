#!/bin/bash
# B2B Sourcing Portal — local dev startup
# Usage: ./dev.sh

cd "$(dirname "$0")"   # always runs from project root regardless of where you call it from

echo "🐘 Starting PostgreSQL..."
docker compose up -d

echo "⏳ Waiting for Postgres to be ready..."
sleep 3

echo "🔄 Running pending migrations..."
npx prisma migrate deploy

echo "🚀 Starting Next.js dev server..."
FORCE_COLOR=0 node ./node_modules/next/dist/bin/next dev --port 3000
