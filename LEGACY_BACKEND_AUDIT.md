# SAN Photography Legacy Backend Cleanup

Cleanup date: 2026-09-16

## Result

The unused Node backend was removed. The active application now consists of React/Vite, PHP APIs, MySQL, and Cloudinary. The PHP backend and database schema/data were preserved.

## Deleted

- Legacy Node server entry point.
- Node route, controller, model, config, utility, environment, and generated dependency files.
- The unused Social Management React page and `/admin/social` route.
- Executable legacy migration fallbacks that referred to the retired service.

## Preserved

- `backend/php/` and all PHP API/auth/config/helper files.
- `backend/database/schema.sql` and all MySQL tables/data.
- React public pages and active admin modules.
- `src/services/cloudinary.js` and Cloudinary assets.

## Dependency cleanup

- Removed the obsolete backend package metadata and generated Node dependency tree.
- Added the official `typescript` compiler so the requested no-emit validation can run.
- Root `npm install` completed with zero vulnerabilities.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- PHP syntax validation: passed.
- PHP health endpoint: HTTP 200; MySQL connected.
- React root: HTTP 200.
- Active source scans for the retired backend terms, old port, Social Management wiring, and legacy API marker: zero matches.

The SQL schema file retains historical comments identifying former model names; it was intentionally not modified because the database schema was explicitly protected.
