import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

test('secret audit scans staged content separately from the working tree without printing values', t => {
  const directory = mkdtempSync(join(tmpdir(), 'qa-secrets-'));
  t.after(() => {
    assert.equal(dirname(directory), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('qa-secrets-'));
    rmSync(directory, { recursive: true, force: true });
  });
  const git = args => assert.equal(spawnSync('git', args, { cwd: directory, encoding: 'utf8' }).status, 0);
  const file = join(directory, 'fixture.txt');
  const fakeKey = 'gh' + 'p_' + 'A'.repeat(36);
  const audit = () => spawnSync(process.execPath, [fileURLToPath(new URL('./security-audit.mjs', import.meta.url))], { cwd: directory, encoding: 'utf8' });
  git(['init', '--quiet']);
  writeFileSync(file, 'clean'); git(['add', 'fixture.txt']);
  assert.equal(audit().status, 0);
  writeFileSync(file, fakeKey); git(['add', 'fixture.txt']);
  writeFileSync(file, 'clean');
  const staged = audit();
  assert.equal(staged.status, 1);
  assert.ok((staged.stdout + staged.stderr).includes('fixture.txt'));
  assert.ok(!(staged.stdout + staged.stderr).includes(fakeKey));
  git(['add', 'fixture.txt']); writeFileSync(file, fakeKey);
  const worktree = audit();
  assert.equal(worktree.status, 1);
  assert.ok((worktree.stdout + worktree.stderr).includes('fixture.txt'));
  assert.ok(!(worktree.stdout + worktree.stderr).includes(fakeKey));
});
