# Vite/Fastify Refactor Handoff

Last updated: 2026-06-04

## Current State

The repo has been refactored from a Next.js compatibility migration into a Vite React + TypeScript SPA served by a Fastify runtime.

The intended architecture is now:

- Client: Vite, React 19, TypeScript, React Router, Tailwind CSS 4.
- Server: Fastify on port `3000`, serving both API routes and the SPA on the same origin.
- Dev: Fastify starts the app and mounts Vite middleware for client assets/HMR.
- Production: `pnpm build` writes `dist/client` and `dist/server`, then `pnpm start` runs `dist/server/index.js`.
- Toolchain: Node `v24.14.1` and pnpm `10.14.0`.
- Docker: official `node:24-alpine` image family with pnpm activated through Corepack.

The repo is still dirty and not committed. Treat this as a handoff snapshot before creating the first refactor commit.

## What Is Good

- Next.js runtime/build dependencies have been removed from production code.
- Client Next imports have been replaced with app-native React/Vite equivalents:
  - Router behavior uses `react-router-dom` wrappers.
  - Image usage no longer depends on `next/image`.
  - Theme behavior no longer depends on `next-themes`.
- API routes have been moved to Fastify route modules under `src/server/routes`.
- The generated Next route adapter path has been removed from the runtime direction.
- Fastify handles SPA serving, API registration, auth guards, cookies, static assets, and runtime config.
- React Compiler is configured through the Vite React plugin path using `@vitejs/plugin-react`, `@rolldown/plugin-babel`, and `babel-plugin-react-compiler`.
- Node tooling is now pinned consistently:
  - `.nvmrc` is `v24.14.1`.
  - `package.json` enforces `node >=24 <25` and `pnpm 10.14.0`.
  - `.npmrc` has `engine-strict=true`.
  - Docker uses `node:24-alpine`.
  - Server bundling targets `node24`.
- Search SSE completion was fixed:
  - Shortdrama is included as an invoked async source.
  - Completion reaches the expected source count.
  - The header text clarifies source progress instead of implying visible card count.
  - Aggregated search can still show fewer cards than source count by design.
- Search result cover badges and search-history pill close button were adjusted visually.
- The exact player URL that previously failed was manually confirmed working during the session:
  - `http://localhost:3000/play?title=%E6%9C%A8%E4%B9%83%E4%BC%8A&year=2026&stype=movie&source=maotaizy&id=129378`

## Verified

These checks were run with Node `v24.14.1` and pnpm `10.14.0` unless noted.

```bash
node -v
# v24.14.1

pnpm -v
# 10.14.0
```

```bash
pnpm typecheck
# passed
```

```bash
pnpm lint
# passed with warnings
# 0 errors, 287 warnings
```

```bash
pnpm test --runInBand
# passed
# 13 test suites, 30 tests
```

Important: with pnpm `10.14.0`, use `pnpm test --runInBand`. The older-looking form `pnpm test -- --runInBand` forwarded `--` into Jest and caused Jest to treat `--runInBand` as a test pattern.

```bash
pnpm build
# passed
```

```bash
rg "v20|node20|Node 20|node:20|apk add --no-cache nodejs" . \
  --glob '!node_modules/**' \
  --glob '!dist/**'
# no matches
```

```bash
docker build -t orangetv-refactor-smoke:local .
# passed
```

Docker build details:

- Pulled and used `node:24-alpine`.
- Activated `pnpm@10.14.0` in Docker stages.
- Installed dependencies with the lockfile.
- Ran in-container `pnpm build`.
- Exported image as `orangetv-refactor-smoke:local`.

## Verified Earlier In The Refactor

These checks were done before the final Node 24 pin and are still useful context:

- API route parity check found 63 old app API routes and 63 new Fastify route paths.
- No missing route paths were identified in that comparison.
- No method mismatches were identified in that comparison.
- Static Next production-reference scans found no remaining production `next/*` imports.
- Local dev with Redis was used during debugging.
- Search route and player route issues were reproduced and fixed against the running dev server.

## Known Warnings

`pnpm lint` currently passes but reports 287 warnings. The warning categories are mostly:

- import sorting
- `no-console`
- explicit `any`
- React hook dependency warnings
- unused imports/vars
- non-null assertions

`pnpm test --runInBand` passes but Jest prints an open-handle warning after completion:

- `Jest did not exit one second after the test run has completed.`

`pnpm build` and Docker build pass but include expected build warnings:

- `/runtime-config.js` script in `index.html` cannot be bundled without `type="module"`.
- `tailwind.config.ts` is reparsed as ESM because `package.json` does not declare `"type": "module"`.
- `artplayer-plugin-danmuku` uses CommonJS `module` inside an ESM bundle.
- Some chunks are larger than 500 kB.
- `hls.js` and `artplayer` dynamic imports are ineffective because they are also imported statically elsewhere.
- `@rolldown/plugin-babel` dominates build plugin time.
- Browserslist data is stale.

These warnings existed as non-blocking issues during verification. They should not block the first refactor commit unless release standards require warning cleanup.

## Remaining Gaps

These are the main gaps to address before calling the refactor fully production-ready.

1. Docker runtime smoke was not completed.
   - The image builds.
   - The container has not yet been run and checked via `/api/health`, login, player page, and admin page.

2. Production runtime smoke is still limited.
   - `pnpm build` passes.
   - A fresh `pnpm start` smoke with HTTP checks was not run after the final Node 24 pin.

3. Chat/WebSocket parity needs focused review.
   - HTTP chat routes exist in the Fastify route tree.
   - Full WebSocket behavior should be compared against the old deployment expectations before claiming chat parity.

4. Lint warning debt remains large.
   - Lint exits successfully, but the warning count is high.
   - A follow-up cleanup pass should decide which warnings are acceptable and which should become errors.

5. Jest open-handle warning remains.
   - Tests pass, but async cleanup should be investigated before tightening CI.

6. Bundle-size and import-splitting warnings remain.
   - Player-related libraries are large and currently defeat some dynamic imports.
   - This is not a correctness blocker, but it is relevant for performance.

7. Browser smoke should be repeated after the final commit candidate.
   - Prior manual checks were useful, but a final pass should cover search, detail, play, favorites, play records, admin config, and theme save/load.

8. Git hygiene needs review before commit.
   - The worktree includes broad refactor changes plus Node 24 pinning.
   - `docs/superpowers/specs/2026-04-09-orangetv-a2-design.md` was already modified outside this handoff task and should be reviewed before staging.

## Important Commands

Local dev:

```bash
pnpm dev
```

Local dev with Redis:

```bash
pnpm dev:redis
```

Production build:

```bash
pnpm build
```

Production start:

```bash
pnpm start
```

Full local verification set:

```bash
node -v
pnpm -v
pnpm typecheck
pnpm lint
pnpm test --runInBand
pnpm build
docker build -t orangetv-refactor-smoke:local .
```

Static checks worth keeping:

```bash
rg "next/|NextRequest|NextResponse|next-env|next.config|eslint-config-next|next-themes|next-pwa" . \
  --glob '!node_modules/**' \
  --glob '!dist/**'

rg "v20|node20|Node 20|node:20|apk add --no-cache nodejs" . \
  --glob '!node_modules/**' \
  --glob '!dist/**'
```

## Suggested Next Steps

1. Run the Docker image and smoke it:

```bash
docker run --rm -p 3000:3000 \
  -e USERNAME=admin \
  -e PASSWORD=orange \
  -e VITE_STORAGE_TYPE=redis \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  orangetv-refactor-smoke:local
```

Then check:

- `GET http://localhost:3000/api/health`
- login as `admin` / `orange` if those env vars are used
- `/search?q=%E6%AD%8C%E6%89%8B2026`
- the known player URL
- `/admin`

2. Run a final browser smoke on `pnpm dev:redis`.

3. Review chat/WebSocket behavior explicitly.

4. Decide whether to clean warnings now or track them as follow-up issues.

5. Stage only the intended refactor files, then create the first refactor commit.
