// scripts/check-node-pins.sh (#96) against small pin files written per test,
// so every line number below is exact and no edit to the repo's own .nvmrc,
// Dockerfile or package.json moves it. The fixture holds the FROM shapes the
// script must read: three node stages, a FROM that builds on an earlier
// stage and a stage of another image. A test edits one line into one failure
// class and asserts the exit code and the message that names the pin.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const repo = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = path.join(repo, 'scripts', 'check-node-pins.sh');

const dockerLines = [
  '# syntax=docker/dockerfile:1.28', // 1
  'FROM node:24-alpine AS builder', // 2
  'RUN npm ci',
  'FROM --platform=linux/amd64 docker.io/library/node:24.12.0-bookworm-slim@sha256:0123abcd AS deps', // 4
  'FROM builder AS test', // 5: builds on the stage of line 2
  'from node:24 as runtime', // 6: lowercase keywords
  'FROM caddy:2-alpine AS runner', // 7: not a node image
  'COPY --from=builder /app/dist /srv',
];
const fixture: Record<string, string> = {
  '.nvmrc': '24\n',
  Dockerfile: `${dockerLines.join('\n')}\n`,
  'package.json': `${JSON.stringify({ devDependencies: { '@types/node': '^24.12.4' } }, null, 2)}\n`,
};

const base = mkdtempSync(path.join(tmpdir(), 'check-node-pins-'));
// The current test's copy of the fixture: base/<test number>.
let dir = '';
let testNumber = 0;

afterAll(() => {
  rmSync(base, { recursive: true, force: true });
});

beforeEach(() => {
  testNumber += 1;
  dir = path.join(base, String(testNumber));
  mkdirSync(dir);
  for (const [file, text] of Object.entries(fixture)) writeFileSync(path.join(dir, file), text);
});

function write(file: string, text: string): void {
  writeFileSync(path.join(dir, file), text);
}

// Replace line `at` (1-based) of the Dockerfile with `text`, which may hold several lines.
function setDockerLine(at: number, text: string): void {
  const p = path.join(dir, 'Dockerfile');
  const lines = readFileSync(p, 'utf8').split('\n');
  if (at < 1 || at > lines.length) throw new Error(`Dockerfile has no line ${at}`);
  lines[at - 1] = text;
  writeFileSync(p, lines.join('\n'));
}

// Move the three node stages of the fixture to `major`.
function setDockerMajor(major: string, stages = [2, 4, 6]): void {
  for (const at of stages) setDockerLine(at, dockerLines[at - 1]!.replace('node:24', `node:${major}`));
}

function writeTypesNode(range: string, key = 'devDependencies'): void {
  write('package.json', JSON.stringify({ [key]: { '@types/node': range } }));
}

function run(args: string[] = [dir], env: NodeJS.ProcessEnv = process.env) {
  const p = spawnSync(scriptPath, args, { encoding: 'utf8', env });
  return { code: p.status, out: p.stdout, err: p.stderr };
}

// Run on the test's copy and expect exit 0 with `message` on stdout.
function passesWith(message: string): string {
  const { code, out, err } = run();
  expect(code, err).toBe(0);
  expect(out).toContain(message);
  return err;
}

// Run on the test's copy and expect exit 1 with every message on stderr.
function failsWith(...messages: string[]): string {
  const { code, err } = run();
  expect(code, err).toBe(1);
  for (const message of messages) expect(err).toContain(message);
  return err;
}

describe('check-node-pins.sh passes', () => {
  it('on the repo pins', () => {
    const { code, out, err } = run([repo]);
    expect(code, err).toBe(0);
    expect(out).toContain('pins read Node');
  });

  it('on every FROM shape of the fixture, reading all five pins', () => {
    passesWith('5 pins read Node 24');
  });

  it('on CRLF line endings', () => {
    for (const file of Object.keys(fixture)) write(file, fixture[file]!.replaceAll('\n', '\r\n'));
    passesWith('5 pins read Node 24');
  });

  it.each(['v24', '24.12', 'v24.12.0', '  24  \n', '\n# the Node CI runs\n24\n'])('on an .nvmrc of %j', (text) => {
    write('.nvmrc', text);
    passesWith('5 pins read Node 24');
  });

  it.each(['~24.1.0', '24.12.4', '24', '24.x', '^24.0.0-rc.1'])('on @types/node %s', (range) => {
    writeTypesNode(range);
    passesWith('5 pins read Node 24');
  });

  it('on @types/node in dependencies', () => {
    writeTypesNode('^24.12.4', 'dependencies');
    passesWith('5 pins read Node 24');
  });

  it('on a FROM that builds on an earlier stage named node', () => {
    setDockerLine(2, 'FROM node:24-alpine AS node');
    setDockerLine(5, 'FROM node AS test');
    passesWith('5 pins read Node 24');
  });

  it('on a registry with a port', () => {
    setDockerLine(6, 'FROM localhost:5000/node:24-alpine');
    passesWith('5 pins read Node 24');
  });

  it('on a FROM continued over lines that hold a comment and a blank line', () => {
    setDockerLine(4, 'FROM --platform=linux/amd64 \\\n  # the deps stage\n\n  docker.io/library/node:24.12.0-bookworm-slim \\\n  AS deps');
    passesWith('5 pins read Node 24');
  });
});

describe('check-node-pins.sh warns, and still passes', () => {
  it('when the shell runs another Node major than the pins', () => {
    write('.nvmrc', '99\n');
    setDockerMajor('99');
    writeTypesNode('^99.0.0');
    expect(passesWith('5 pins read Node 99')).toContain('warning: this shell runs Node');
  });

  it('not when the shell runs the pinned major', () => {
    const running = execFileSync('node', ['--version'], { encoding: 'utf8' }).replace(/^v/, '').split('.')[0]!;
    write('.nvmrc', `${running}\n`);
    setDockerMajor(running);
    writeTypesNode(`^${running}.0.0`);
    expect(passesWith(`5 pins read Node ${running}`)).toBe('');
  });
});

describe('check-node-pins.sh fails when a pin differs, listing every pin', () => {
  it('.nvmrc', () => {
    write('.nvmrc', '26\n');
    failsWith('the Node majors differ', '.nvmrc  26 (26)', 'Dockerfile:2  24 (node:24-alpine)');
  });

  it.each([2, 4, 6])('the Dockerfile stage on line %d', (at) => {
    setDockerMajor('26', [at]);
    failsWith('the Node majors differ', `Dockerfile:${at}  26 (`, '.nvmrc  24 (24)');
  });

  it('a node image on the continued line of a FROM', () => {
    setDockerLine(6, 'FROM \\\n  node:26-alpine AS runtime');
    failsWith('the Node majors differ', 'Dockerfile:6  26 (node:26-alpine)');
  });

  it('package.json @types/node', () => {
    writeTypesNode('^26.0.0');
    failsWith('the Node majors differ', 'package.json @types/node  26 (^26.0.0)', '.nvmrc  24 (24)');
  });
});

describe('check-node-pins.sh fails when it cannot read a pin', () => {
  it.each(['.nvmrc', 'Dockerfile', 'package.json'])('a %s that is gone', (file) => {
    renameSync(path.join(dir, file), path.join(dir, `${file}.old`));
    failsWith(`${file} not found`);
  });

  it.each(['', '\n# only a comment\n'])('an .nvmrc of %j', (text) => {
    write('.nvmrc', text);
    failsWith('.nvmrc is empty');
  });

  it.each(['lts/*', 'lts/krypton', 'node', '24.12.0.1', '24a12'])('an .nvmrc that names %s', (text) => {
    write('.nvmrc', `${text}\n`);
    failsWith(`.nvmrc '${text}' is not a Node version`);
  });

  it.each([
    ['node:lts-alpine', "node tag 'lts-alpine' does not start with a Node major"],
    ['node:alpine', "node tag 'alpine' does not start with a Node major"],
    ['node', 'node has no tag'],
    ['node@sha256:0123abcd', 'node@sha256:0123abcd has no tag'],
  ])('a Dockerfile stage FROM %s', (image, message) => {
    setDockerLine(6, `FROM ${image}`);
    failsWith(`Dockerfile:6 ${message}`);
  });

  it.each(['FROM ${IMG}', 'FROM --platform=linux/amd64 ${IMG}'])(
    'a Dockerfile stage that takes its image from a build arg: %s',
    (from) => {
      setDockerLine(6, `ARG IMG=node:24\n${from}`);
      failsWith('Dockerfile:7 FROM takes its image from a build arg');
    },
  );

  it('a Dockerfile with no node stage', () => {
    for (const at of [2, 4, 6]) setDockerLine(at, 'FROM debian:bookworm-slim');
    failsWith('Dockerfile has no FROM node line');
  });

  it('a package.json that is not JSON, without a stack trace', () => {
    write('package.json', '{ "devDependencies": { "@types/node": "^24.12.4", } }');
    expect(failsWith('package.json is not valid JSON')).not.toContain('SyntaxError');
  });

  it.each([
    ['no @types/node', JSON.stringify({ devDependencies: { typescript: '^6.0.0' } })],
    ['a JSON null', 'null'],
  ])('a package.json with %s', (_name, text) => {
    write('package.json', text);
    expect(failsWith('package.json has no @types/node')).not.toContain('TypeError');
  });

  it.each(['>=24', '^24 || ^26', '*', 'latest'])('@types/node %s, which pins no one major', (range) => {
    writeTypesNode(range);
    failsWith(`package.json @types/node '${range}' does not pin one Node major`);
  });
});

describe('check-node-pins.sh exits 2', () => {
  it('on a directory that does not exist', () => {
    const { code, err } = run([path.join(base, 'missing')]);
    expect(code).toBe(2);
    expect(err).toContain('no directory');
  });

  it('on two arguments', () => {
    const { code, err } = run([dir, dir]);
    expect(code).toBe(2);
    expect(err).toContain('usage:');
  });

  it('without node on PATH', () => {
    // A PATH holding bash alone, for the script's `#!/usr/bin/env bash`.
    const bin = path.join(dir, 'bin');
    mkdirSync(bin);
    symlinkSync(execFileSync('bash', ['-c', 'command -v bash'], { encoding: 'utf8' }).trim(), path.join(bin, 'bash'));
    const { code, err } = run([dir], { PATH: bin });
    expect(code).toBe(2);
    expect(err).toContain('needs node on PATH');
  });
});
