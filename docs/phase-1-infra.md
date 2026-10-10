# Phase 1: Infrastructure — 2026-10-01

Scope: repository and infrastructure only, following spec §44. No later-phase business behavior or automated tests were implemented.

| Check | Result |
| --- | --- |
| Backend `mvnw.cmd clean package -DskipTests` on Java 21 | PASS; executable jar produced with Spring Boot 3.4.3. |
| Linux wrapper packaging inside the backend Docker build | PASS; `./mvnw -B -ntp clean package -DskipTests`. |
| Frontend `npm run build` | PASS; strict TypeScript compilation and Vite production assets. |
| Clean lockfile installation and frontend build in Node 22 container | PASS; Docker build uses `npm ci`. |
| Default and development-override Compose configuration | PASS; both `docker compose config --quiet` checks. |
| `docker compose up --build --detach --wait --wait-timeout 180` | PASS; default project has three healthy services. |
| Empty PostgreSQL 16 startup | PASS; checked using fresh isolated and default project volumes. |
| Flyway/JPA startup order | PASS; schema creation and V1 precede EntityManagerFactory initialization. |
| Migration persistence across backend recreation/restart | PASS; V1 remains recorded once; subsequent startup says no migration necessary. |
| Nginx configuration and static assets | PASS; `nginx -t`, homepage, JS/CSS assets, and `/healthz` succeed. |
| SPA fallback | PASS; unknown frontend URL serves the application document. |
| Proxied backend health/readiness/liveness | PASS; HTTP 200, `status=UP`. |
| Infrastructure security | PASS; business API and non-health Actuator requests return 403; runtime backend is non-root. |
| Vite development proxy | PASS; the development server forwards readiness requests to the running backend through the configured target. |
| Production profile with explicit datasource credentials | PASS; starts successfully and health is accessible. |
| Database outage/recovery | PASS; readiness returns HTTP 503 with `status=DOWN` in about 3 seconds, while liveness stays UP; readiness recovers after PostgreSQL starts. |
| Backend outage/recovery | PASS; static frontend remains HTTP 200, proxied readiness fails, and health recovers after restart. |

The outage check identified a database wait exceeding the Nginx timeout. Hikari acquisition/validation timeouts were corrected, the backend was rebuilt, and the database outage check was repeated successfully.

The default stack remains running at <http://localhost:8080>. Stop it with `docker compose down`; this preserves its data volume. The isolated verification containers were removed, preserving their separate volume. Existing unrelated Docker volumes were not changed.

Hibernate is configured with `ddl-auto=validate` and successfully initializes after Flyway. Phase 1 has no mapped domain entities; validation of domain mappings belongs to their implementation phases. V1 establishes the application schema/history only.

Verification used builds, container startup, HTTP requests, and read-only database queries. Visual rendering and browser interactions remain manual checklist items; no browser-driven verification or automated test suite is claimed.

## Phase 1 review and corrections

The subsequent review confirmed two infrastructure defects and corrected them:

- Nginx retained the backend's old IP after container replacement. In an isolated project, the healthy backend moved from one IP to another while Nginx returned 502. Docker DNS resolution now refreshes the address. Repeating the replacement with a third IP returned HTTP 200 and `status=UP`, with the frontend container ID unchanged. Requests with a query string also succeeded.
- HTML and assets omitted the configured response headers because their location-level cache headers suppressed parent header inheritance. A shared header snippet is now included in those locations. HTTP HEAD checks confirmed `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and the correct cache policy on both HTML and JS assets.

The review repeated the Java 21 backend build, clean npm installation/frontend build, fresh isolated Compose startup, migration persistence inspection, Compose configuration validation (including `.env.example` and the development override), and Nginx syntax validation. All passed. Applied V1 was left unchanged; no domain tables, authentication flows, or other Phase 2 functionality were introduced.
