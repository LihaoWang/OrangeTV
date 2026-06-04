ARG BUILDPLATFORM
ARG TARGETPLATFORM
ARG NODE_VERSION=24
ARG PNPM_VERSION=10.14.0

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS deps

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
ENV HUSKY=0
RUN pnpm install --frozen-lockfile

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS builder

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DOCKER_ENV=true
RUN pnpm build

FROM node:${NODE_VERSION}-alpine AS runner

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S orangetv -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DOCKER_ENV=true

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && pnpm store prune

COPY --from=builder --chown=orangetv:nodejs /app/dist ./dist
COPY --from=builder --chown=orangetv:nodejs /app/public ./public

RUN cat > /app/healthcheck.js <<'EOF'
const http = require('http');

const req = http.request(
  {
    hostname: 'localhost',
    port: Number(process.env.PORT || 3000),
    path: '/api/health',
    method: 'GET',
    timeout: 5000,
  },
  (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  }
);

req.on('error', () => process.exit(1));
req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});
req.end();
EOF

RUN chown orangetv:nodejs /app/healthcheck.js

USER orangetv

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node /app/healthcheck.js

CMD ["node", "dist/server/index.js"]
