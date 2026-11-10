# Backup and restore

Odyssey keeps state in two places:

1. **MySQL** — users, journals, comments, reactions, follows, notifications and
   reports (the `odyssey_db` database).
2. **Uploads** — original images on the `uploads` volume. Database rows only
   store URLs, so a database-only backup loses images.

Take both together for a complete backup.

## With Docker Compose

Set the same values you used for deployment (`MYSQL_ROOT_PASSWORD`,
`MYSQL_DATABASE`) and run from the repository root.

### Database

```bash
mkdir -p backups
docker compose exec -T mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --quick --routines --triggers \
  "$MYSQL_DATABASE" > "backups/odyssey-$(date +%F-%H%M).sql"
```

`--single-transaction` gives a consistent snapshot without locking InnoDB
tables for long.

### Uploads

```bash
docker run --rm \
  -v odyssey_uploads:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine tar czf /backup/uploads-$(date +%F-%H%M).tar.gz -C /data .
```

The volume name is `<compose-project>_uploads`; check it with
`docker volume ls` if your project directory is not named `odyssey`. Without
Docker, archive the `FILE_UPLOAD_DIR` directory directly:

```bash
tar czf backups/uploads-$(date +%F-%H%M).tar.gz -C odyssey-backend uploads
```

### Restore

Stop the backend so nothing writes during the restore:

```bash
docker compose stop backend

docker compose exec -T mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < backups/odyssey-YYYY-MM-DD-HHMM.sql

docker run --rm \
  -v odyssey_uploads:/data \
  -v "$PWD/backups:/backup:ro" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads-YYYY-MM-DD-HHMM.tar.gz -C /data"

docker compose start backend
```

Flyway records its applied versions inside the database, so restoring a dump
also restores the migration history. Do not run Flyway against a partially
restored schema.

## Without Docker

```bash
mysqldump -u root -p --single-transaction --quick --routines --triggers \
  odyssey_db > odyssey-backup.sql

mysql -u root -p odyssey_db < odyssey-backup.sql
```

Then restore the uploads directory as above.

## Recommended schedule

- Nightly database dump, retained for 14 days.
- Weekly uploads archive, retained for 8 weeks.
- A monthly restore drill into a scratch database and volume.
- Store backups off the host (object storage or another machine), encrypted at
  rest. Backups contain personal data, so treat them with the same care as the
  production database.

## Verify a backup

```bash
# Row counts should be non-zero and match production.
docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" odyssey_db \
  -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM journals; SELECT COUNT(*) FROM comments;"
```
