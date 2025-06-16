@echo off
REM Environment Configuration Script for Jomsecarly Client
REM Usage: configure-env.bat [local|production|staging]

set ENV=%1
if "%ENV%"=="" set ENV=local

if "%ENV%"=="local" (
    echo # API Base URL - Development Environment > .env
    echo VITE_API_URL=http://localhost:3000/api >> .env
    echo ✅ Configured for LOCAL development environment
    echo Current API URL: http://localhost:3000/api
) else if "%ENV%"=="production" (
    echo # API Base URL - Production Environment > .env
    echo VITE_API_URL=https://jomsecarly-server-production.up.railway.app/api >> .env
    echo ✅ Configured for PRODUCTION environment
    echo Current API URL: https://jomsecarly-server-production.up.railway.app/api
) else if "%ENV%"=="staging" (
    echo # API Base URL - Staging Environment > .env
    echo VITE_API_URL=https://jomsecarly-server-staging.up.railway.app/api >> .env
    echo ✅ Configured for STAGING environment
    echo Current API URL: https://jomsecarly-server-staging.up.railway.app/api
) else (
    echo ❌ Invalid environment. Use: local, production, or staging
    echo Usage: configure-env.bat [local^|production^|staging]
    exit /b 1
)

pause
