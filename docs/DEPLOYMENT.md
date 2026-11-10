# Deploying Odyssey

Odyssey ships as three containers:

| Service | Image | Purpose |
| --- | --- | --- |
| `frontend` | nginx + Vite build | Serves the SPA and proxies `/api` to the backend |
| `backend` | Spring Boot 3 on JRE 17 | REST API, authentication, uploads and Flyway migrations |
| `mysql` | MySQL 8 | Persistent relational data |

The Compose stack is defined in [`docker-compose.yml`](../docker-compose.yml).

## Quick start

1. Install Docker Engine with the Compose v2 plugin.
2. Copy the environment template and set real secrets:

   ```bash
   cp .env.example .env
   ```

   At minimum set `MYSQL_ROOT_PASSWORD` and `JWT_SECRET`. Generate the JWT
   secret with `openssl rand -base64 48` (or any 32+ byte random string).
3. Start the stack:

   ```bash
   docker compose up -d --build
   ```

4. Open <http://localhost:8080>. The API is reachable at
   <http://localhost:9090/api> and health at
   <http://localhost:9090/actuator/health>.

Flyway applies `V1`–`V4` automatically on the first backend start.

## Promote an administrator

There is no public sign-up for the admin role. Create a normal account, then
promote it directly in MySQL:

```bash
docker compose exec mysql mysql -uroot -p odyssey_db \
  -e "UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';"
```

Sign out and back in so the new authority is picked up. The Moderation page is
then available at `/admin` and in the account menu.

## Configuration

All backend settings come from environment variables (see
`odyssey-backend/src/main/resources/application.properties`). The Compose file
passes the values from `.env`.

| Variable | Required | Notes |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | yes | Database password; also used by the backend |
| `JWT_SECRET` | yes | At least 32 bytes; rotating it signs everyone out |
| `FRONTEND_URL` | no | Used in verification/reset links |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated public origins |
| `COOKIE_SECURE` | no | Set to `true` behind HTTPS |
| `MAIL_MODE` | no | `log` writes links to logs; `smtp` sends real email |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | no | Required when `MAIL_MODE=smtp` |
| `RATE_LIMIT_ENABLED` | no | Per-IP auth rate limiting, defaults to `true` |
| `JAVA_OPTS` | no | JVM flags, defaults to a container-aware heap |

## TLS and reverse proxies

Terminate TLS in front of the `frontend` container (Caddy, Traefik, nginx,
a cloud load balancer, or Cloudflare). Forward traffic to port `8080`.

When HTTPS is enabled:

- set `COOKIE_SECURE=true`
- set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the public `https://` origin
- keep the `X-Forwarded-*` headers intact so cookies and rate limiting see the
  real client

The bundled nginx config already proxies `/api` to the backend and serves
hashed assets with long-lived cache headers.

## Uploads

Uploaded images live in the `uploads` volume mounted at `/app/uploads`. Back it
up together with the database (see [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).
If you run the backend without Docker, set `FILE_UPLOAD_DIR` to a persistent
path instead of the default relative `uploads` directory.

## Health and observability

- `GET /actuator/health` — public liveness/readiness, used by the container
  health check.
- `GET /actuator/info` — public build/environment info.
- `GET /actuator/metrics` — admin only.
- `GET /api/admin/stats` — admin-only counts used by the moderation dashboard.

Restrict actuator exposure with `MANAGEMENT_ENDPOINTS` if your platform runs
its own probes.

## Upgrades

```bash
git pull
docker compose build
docker compose up -d
```

Back up first. Flyway migrations run at startup and are additive; review any new
`V*__*.sql` file before deploying to production.

## Local development

The Docker stack is optional for development. The README describes running the
backend with Maven and the frontend with Vite; both hot-reload and use the same
MySQL schema.
