#!/bin/bash
# Servidor de desarrollo (Vite). La API dev vive en vite-auth-plugin.ts.
cd "$(dirname "$0")"
exec pnpm dev
