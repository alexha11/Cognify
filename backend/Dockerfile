# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Lets Prisma detect OpenSSL, so generate and the installed engines agree with
# the production stage below.
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Prisma's migration engine needs OpenSSL, and it has to be present when the
# engines are installed below so the matching build is downloaded.
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Install production dependencies only (prisma is one: migrations run at start)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

# No usage pings from the Prisma CLI at startup.
ENV CHECKPOINT_DISABLE=1

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check (the first start can take longer while migrations run)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider "http://localhost:${PORT:-3001}/api/health" || exit 1

# Bring the schema up to date, then start. If migrations fail the container
# exits, so a deploy stops instead of serving pages that query missing tables.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node dist/src/main"]
