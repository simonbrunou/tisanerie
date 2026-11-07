// scripts/check-renovate-config.sh (#102 retro) against one renovate.json per
// test, written to its own temp directory: the repo's renovate.json, the repo's
// renovate.json broken in one way the script must refuse, a file that is not
// JSON, or none. Each test asserts the exit code and the message. The script
// runs Renovate's Docker image, so these tests need Docker and run only with
// RENOVATE_CONFIG_TESTS=1, which .forgejo/workflows/renovate-config.yml sets.
// The tests under "with a fake image" need no Docker and always run.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repo = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = path.join(repo, 'scripts', 'check-renovate-config.sh');
const repoConfigText = readFileSync(path.join(repo, 'renovate.json'), 'utf8');
const repoConfig = JSON.parse(repoConfigText);

const base = mkdtempSync(path.join(tmpdir(), 'check-renovate-config-'));
let testNumber = 0;

afterAll(() => {
  rmSync(base, { recursive: true, force: true });
});

// Runs the script on a directory that holds `content` as renovate.json, or no
// renovate.json when `content` is undefined, with `env` added to its
// environment.
function check(content: string | undefined, env: Record<string, string> = {}) {
  const dir = path.join(base, String(++testNumber));
  mkdirSync(dir);
  if (content !== undefined) writeFileSync(path.join(dir, 'renovate.json'), content);
  const result = spawnSync(scriptPath, [dir], { encoding: 'utf8', env: { ...process.env, ...env } });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

const checkRepoConfigWith = (changes: Record<string, unknown>) =>
  check(`${JSON.stringify({ ...repoConfig, ...changes }, null, 2)}\n`);

describe.runIf(process.env.RENOVATE_CONFIG_TESTS === '1')('check-renovate-config.sh', { timeout: 60_000 }, () => {
  // One run before the tests pulls the image (about 2 GB on disk) where it is
  // missing, under a timeout of its own, so no test's timeout covers the pull.
  beforeAll(() => {
    check(repoConfigText);
  }, 900_000);

  it("accepts the repo's renovate.json", () => {
    const result = check(repoConfigText);
    expect(result.output).toContain('Config validated successfully');
    expect(result.output).toContain('check-renovate-config: presets resolved');
    expect(result.status).toBe(0);
  });

  it('refuses an invalid value', () => {
    const result = checkRepoConfigWith({
      lockFileMaintenance: { ...repoConfig.lockFileMaintenance, schedule: ['every blursday'] },
    });
    expect(result.output).toContain('Invalid lockFileMaintenance.schedule');
    expect(result.status).toBe(1);
  });

  it('refuses an option Renovate does not know', () => {
    const result = checkRepoConfigWith({ optionFromTheFuture: true });
    expect(result.output).toContain('Invalid configuration option: optionFromTheFuture');
    expect(result.status).toBe(1);
  });

  // With renovate.json as a file argument, the validator checks it as global
  // config and accepts this option: the script must pass no file argument.
  it('refuses a global-only option', () => {
    const result = checkRepoConfigWith({ allowedCommands: ['^echo'] });
    expect(result.output).toContain('allowedCommands\\" option is a global option');
    expect(result.status).toBe(1);
  });

  it('refuses a config that needs migration', () => {
    const result = checkRepoConfigWith({ extends: ['config:base'] });
    expect(result.output).toContain('Config migration necessary');
    expect(result.status).toBe(1);
  });

  // The validator does not resolve presets and accepts this name (#114): the
  // script's local Renovate run must refuse it.
  it('refuses a preset Renovate does not know', () => {
    const result = checkRepoConfigWith({ extends: ['config:recommended', 'helpers:pinGitHubActionDigestsNOPE'] });
    expect(result.output).toContain("Cannot find preset's package (helpers:pinGitHubActionDigestsNOPE)");
    expect(result.status).toBe(1);
  });

  it('refuses a file that is not JSON', () => {
    const result = check('{"extends": [');
    expect(result.output).toContain('File could not be parsed');
    expect(result.status).toBe(1);
  });

  it('fails when the directory has no renovate.json', () => {
    const result = check(undefined);
    expect(result.output).toContain('no renovate.json in');
    expect(result.status).toBe(2);
  });
});

// Failures of the local Renovate run that no renovate.json causes. A fake
// docker runs the script's in-image commands on this machine, where a fake
// renovate-config-validator passes and a fake renovate prints FAKE_RENOVATE_LOG
// and exits with FAKE_RENOVATE_EXIT.
describe('check-renovate-config.sh with a fake image', () => {
  const bin = path.join(base, 'fake-bin');
  const finished = JSON.stringify({ level: 30, msg: 'Repository finished' });

  beforeAll(() => {
    mkdirSync(bin);
    const fake = (name: string, body: string) => writeFileSync(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    // The script calls docker run ... -c "<in-image commands>": run the last argument.
    fake('docker', 'for last; do :; done\nexec sh -c "$last"');
    fake('renovate-config-validator', 'echo " INFO: Config validated successfully"');
    fake('renovate', 'printf "%s\\n" "$FAKE_RENOVATE_LOG"\nexit "$FAKE_RENOVATE_EXIT"');
  });

  const checkWithFakeRenovate = (log: string, exit: number) =>
    check(repoConfigText, {
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      TMPDIR: base,
      FAKE_RENOVATE_LOG: log,
      FAKE_RENOVATE_EXIT: String(exit),
    });

  it('accepts a run that logs "Repository finished" and no warning', () => {
    const result = checkWithFakeRenovate(finished, 0);
    expect(result.output).toContain('check-renovate-config: presets resolved');
    expect(result.status).toBe(0);
  });

  it('fails when the local Renovate run exits non-zero', () => {
    const result = checkWithFakeRenovate(finished, 1);
    expect(result.output).toContain('check-renovate-config: the local Renovate run failed');
    expect(result.status).toBe(1);
  });

  it('fails when the log holds no JSON "Repository finished" record', () => {
    const result = checkWithFakeRenovate(' INFO: Repository finished (repository=local)', 0);
    expect(result.output).toContain('no "Repository finished" record in its JSON log');
    expect(result.status).toBe(1);
  });
});
