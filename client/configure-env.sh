#!/bin/bash

# Environment Configuration Script for Jomsecarly Client
# Usage: ./configure-env.sh [local|production|staging]

ENV=${1:-local}

case $ENV in
  "local")
    echo "# API Base URL - Development Environment" > .env
    echo "VITE_API_URL=http://localhost:3000/api" >> .env
    echo "✅ Configured for LOCAL development environment"
    ;;
  "production")
    echo "# API Base URL - Production Environment" > .env
    echo "VITE_API_URL=https://jomsecarly-server-production.up.railway.app/api" >> .env
    echo "✅ Configured for PRODUCTION environment"
    ;;
  "staging")
    echo "# API Base URL - Staging Environment" > .env
    echo "VITE_API_URL=https://jomsecarly-server-staging.up.railway.app/api" >> .env
    echo "✅ Configured for STAGING environment"
    ;;
  *)
    echo "❌ Invalid environment. Use: local, production, or staging"
    echo "Usage: ./configure-env.sh [local|production|staging]"
    exit 1
    ;;
esac

echo "Current API URL: $(grep VITE_API_URL .env)"
