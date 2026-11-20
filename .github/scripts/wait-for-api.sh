#!/usr/bin/env bash
# Waits for the API container "api" to answer on :3001, then checks that every
# migration in the repository is recorded as applied. Used by the
# "production image" CI job.
set -euo pipefail

for _ in $(seq 1 60); do
  if curl -fsS http://localhost:3001/api/health; then break; fi
  if [ "$(docker inspect -f '{{.State.Running}}' api)" != true ]; then
    echo "::error::The API exited during startup"
    docker logs api
    exit 1
  fi
  sleep 2
done
echo
curl -fsS http://localhost:3001/api/health
echo
curl -fsS -o /dev/null http://localhost:3001/api/courses

applied=$(PGPASSWORD=cognify psql -h localhost -U cognify -d cognify_prod -tAc \
  'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')
expected=$(find backend/prisma/migrations -mindepth 1 -maxdepth 1 -type d | wc -l)
echo "migrations applied: $applied of $expected"
test "$applied" -eq "$expected"
