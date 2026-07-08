#!/usr/bin/env bash
#
# Staging DB backup over SSH — read-only, safe to run before a deploy.
#
# Connects to the VPS via SSH, runs pg_dump INSIDE the staging Postgres
# container, and streams the dump to a local timestamped .sql file. It does NOT
# deploy, migrate, or mutate anything on the server — it only reads.
#
# Usage:
#   1. cp scripts/staging/backup.env.template scripts/staging/.env
#   2. edit scripts/staging/.env with your real values
#   3. bash scripts/staging/ssh-backup.sh
#
# Config is loaded from scripts/staging/.env (gitignored). Secrets never live
# in this script.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
BACKUP_DIR="${SCRIPT_DIR}/backups"

# ── 1. Load config ──────────────────────────────────────────────────────────
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "❌ Missing ${ENV_FILE}"
  echo "   Run: cp scripts/staging/backup.env.template scripts/staging/.env"
  echo "   Then fill it in and re-run this script."
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a

# ── 2. Validate — no leftover placeholders, required vars present ───────────
missing=0
for var in SSH_HOST SSH_USER SSH_PORT DB_CONTAINER DB_NAME DB_USER; do
  val="${!var:-}"
  if [[ -z "${val}" || "${val}" == REPLACE_WITH_* ]]; then
    echo "❌ Config '${var}' is empty or still a placeholder in ${ENV_FILE}"
    missing=1
  fi
done
[[ "${missing}" -eq 1 ]] && { echo "   Fix the .env and re-run."; exit 1; }

# ── 3. Build the SSH command ────────────────────────────────────────────────
ssh_opts=(-p "${SSH_PORT}" -o ConnectTimeout=10 -o BatchMode=yes)
[[ -n "${SSH_KEY:-}" ]] && ssh_opts+=(-i "${SSH_KEY}")
SSH_TARGET="${SSH_USER}@${SSH_HOST}"

# ── 4. Connection test (fail fast, clear message) ───────────────────────────
echo "🔌 Testing SSH connection to ${SSH_TARGET}:${SSH_PORT}..."
if ! ssh "${ssh_opts[@]}" "${SSH_TARGET}" 'echo ok' >/dev/null 2>&1; then
  echo "❌ SSH connection failed."
  echo "   Check SSH_HOST / SSH_USER / SSH_PORT / SSH_KEY in ${ENV_FILE},"
  echo "   and that your key is authorized on the VPS."
  exit 1
fi
echo "✅ SSH connection OK"

# ── 5. Verify the DB container exists and is running ────────────────────────
echo "🔍 Checking container '${DB_CONTAINER}' is running..."
if ! ssh "${ssh_opts[@]}" "${SSH_TARGET}" "docker ps --format '{{.Names}}' | grep -qx '${DB_CONTAINER}'"; then
  echo "❌ Container '${DB_CONTAINER}' not found among running containers."
  echo "   List them with:"
  echo "     ssh ${SSH_TARGET} \"docker ps --format '{{.Names}}'\""
  echo "   Then update DB_CONTAINER in ${ENV_FILE}."
  exit 1
fi
echo "✅ Container is running"

# ── 6. Dump the database over SSH → local file ──────────────────────────────
mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="${BACKUP_DIR}/staging_${DB_NAME}_${STAMP}.sql"

echo "💾 Dumping '${DB_NAME}' from '${DB_CONTAINER}' → ${OUT}"
# pg_dump runs inside the container; output streams back over SSH to the file.
if ! ssh "${ssh_opts[@]}" "${SSH_TARGET}" \
      "docker exec ${DB_CONTAINER} pg_dump -U ${DB_USER} -d ${DB_NAME} --no-owner --no-privileges" \
      > "${OUT}" 2>"${OUT}.err"; then
  echo "❌ pg_dump failed. Server said:"
  sed 's/^/   /' "${OUT}.err"
  rm -f "${OUT}" "${OUT}.err"
  exit 1
fi
rm -f "${OUT}.err"

# ── 7. Sanity-check the dump ────────────────────────────────────────────────
bytes="$(wc -c < "${OUT}" | tr -d ' ')"
if [[ "${bytes}" -lt 1000 ]]; then
  echo "❌ Dump looks too small (${bytes} bytes) — treating as failed."
  echo "   Inspect ${OUT} manually before trusting it."
  exit 1
fi

tables="$(grep -c 'CREATE TABLE' "${OUT}" || true)"
human="$(du -h "${OUT}" | cut -f1)"

echo ""
echo "✅ Backup complete"
echo "   File:   ${OUT}"
echo "   Size:   ${human} (${bytes} bytes)"
echo "   Tables: ${tables} CREATE TABLE statements"
echo ""
echo "   This dump is your rollback safety net. Keep it until you've confirmed"
echo "   the staging deploy is healthy and the existing data is intact."
