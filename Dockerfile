FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# CLI de Prisma aislado, solo para "migrate deploy" al arrancar
FROM node:24-alpine AS prisma-cli
WORKDIR /cli
RUN npm init -y >/dev/null && npm install --no-audit --no-fund prisma@7.8.0 dotenv@17

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# App standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Migraciones + CLI
COPY --from=builder /app/prisma ./prisma
COPY --from=prisma-cli /cli/node_modules ./cli/node_modules
COPY docker/prisma.config.ts ./cli/prisma.config.ts

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["./docker-entrypoint.sh"]
