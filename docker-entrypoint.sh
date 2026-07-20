#!/bin/sh
set -e

echo "Aplicando migraciones…"
(cd cli && node_modules/.bin/prisma migrate deploy)

echo "Iniciando servidor…"
exec node server.js
