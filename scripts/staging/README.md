# Staging DB backup over SSH

Read-only backup of the staging Postgres DB, run **before** deploying a change
to staging. It connects to the VPS via SSH and runs `pg_dump` inside the
Postgres container. It does **not** deploy, migrate, or mutate anything — only
reads.

## Why this exists

Staging holds **real, irreplaceable user data**. Before shipping a large change
(e.g. the `etapa-10-23-meses` tracker, ~121 commits), take a dump so any
surprise is reversible. The staging deploy applies the Prisma schema with a
`db push --accept-data-loss` fallback (see `docker-compose.staging.yml`); a
backup turns "low risk" into "recoverable no matter what".

## Setup (once)

```bash
cp scripts/staging/backup.env.template scripts/staging/.env
# edit scripts/staging/.env with your real values
```

`scripts/staging/.env` is **gitignored** — secrets never reach the repo.
Fill in: `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_KEY` (optional),
`DB_CONTAINER`, `DB_NAME`, `DB_USER`.

To find the container name, on the VPS:

```bash
ssh <user>@<host> "docker ps --format '{{.Names}}'"
```

## Run

```bash
bash scripts/staging/ssh-backup.sh
```

The dump lands in `scripts/staging/backups/staging_<db>_<timestamp>.sql`
(also gitignored). The script fails loudly if the connection, container, or
dump is not healthy.

## Restore (only if something goes wrong)

```bash
# copy the dump to the VPS, then:
ssh <user>@<host> "docker exec -i <DB_CONTAINER> psql -U <DB_USER> -d <DB_NAME>" \
  < scripts/staging/backups/staging_<db>_<timestamp>.sql
```

> ⚠️ Restoring overwrites current data. Only do this to recover from a bad
> deploy, and confirm the target DB is the intended one first.
