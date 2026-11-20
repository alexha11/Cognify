#!/usr/bin/env node
/**
 * Brings the database schema up to date. `npm run start:prod` and the Docker
 * image run this before the API starts; `npm run db:migrate` runs it alone.
 *
 * It is `prisma migrate deploy`, plus help for two database states left by the
 * project's history, recognised from Prisma's own error codes:
 *
 * - P3005, "the database schema is not empty": the database was created with
 *   `prisma db push`, so it has no migration history. Every statement in the
 *   baseline migration is guarded (IF NOT EXISTS / duplicate_object), so it is
 *   run, which adds anything the push left out (such as the vector index), and
 *   then recorded as applied.
 *
 * - P3009, "found failed migrations": a migration from the history that was
 *   replaced in November 2026 failed on this database and is still recorded as
 *   failed. If that migration no longer exists in this repository, its record
 *   is marked rolled back: the guarded baseline covers what it was for. A
 *   failed migration that still exists here is left alone for a person to
 *   look at.
 *
 * Exits non-zero on any other failure, so a deploy stops instead of starting
 * an API whose queries would fail against an old schema.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'prisma', 'migrations');
const BASELINE = '20261120000000_baseline';
const prismaBin = join(root, 'node_modules', '.bin', 'prisma');

function prisma(args, input) {
  const result = spawnSync(prismaBin, args, {
    cwd: root,
    encoding: 'utf8',
    input,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  };
}

function fail(message) {
  console.error(`\nmigrate: ${message}`);
  process.exit(1);
}

const log = (message) => console.log(`\nmigrate: ${message}\n`);

if (!existsSync(prismaBin)) {
  fail(`the Prisma CLI is missing (${prismaBin}); is "prisma" installed?`);
}

let deploy = prisma(['migrate', 'deploy']);

if (!deploy.ok && deploy.output.includes('P3005')) {
  log(
    'this database has no migration history (it was created with "prisma db push"). Applying the baseline, which only adds what is missing, and recording it.',
  );
  const baselineSql = join('prisma', 'migrations', BASELINE, 'migration.sql');
  if (!prisma(['db', 'execute', '--file', baselineSql]).ok) {
    fail('the baseline could not be applied.');
  }
  if (!prisma(['migrate', 'resolve', '--applied', BASELINE]).ok) {
    fail('the baseline was applied but could not be recorded.');
  }
  deploy = prisma(['migrate', 'deploy']);
}

if (!deploy.ok && deploy.output.includes('P3009')) {
  const local = new Set(
    readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );
  const failed = [
    ...deploy.output.matchAll(/The `([^`]+)` migration started at/g),
  ].map((match) => match[1]);
  const stillHere = failed.filter((name) => local.has(name));
  if (failed.length === 0 || stillHere.length > 0) {
    fail(
      `failed migration${stillHere.length === 1 ? '' : 's'} ${stillHere.join(', ') || '(unrecognised)'} must be resolved by hand: https://pris.ly/d/migrate-resolve`,
    );
  }
  log(
    `marking ${failed.join(', ')} rolled back: ${failed.length === 1 ? 'it is' : 'they are'} from the replaced migration history, which the baseline covers.`,
  );
  for (const name of failed) {
    if (!/^[\w-]+$/.test(name)) fail(`unexpected migration name: ${name}`);
    const update = `UPDATE "_prisma_migrations" SET "rolled_back_at" = now() WHERE "migration_name" = '${name}' AND "finished_at" IS NULL AND "rolled_back_at" IS NULL;`;
    if (!prisma(['db', 'execute', '--stdin'], update).ok) {
      fail(`could not mark ${name} rolled back.`);
    }
  }
  deploy = prisma(['migrate', 'deploy']);
}

if (!deploy.ok) fail('migrations could not be applied (see above).');
