import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
function git(args, allowed = [0]) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  assert.ok(allowed.includes(result.status), 'Git 보안 검사 실행 실패'); return result.stdout.trim();
}
const revisions = git(['rev-list', '--all']).split('\n').filter(Boolean);
const paths = new Set(git(['ls-files']).split('\n').filter(Boolean));
for (const revision of revisions) for (const path of git(['ls-tree','-r','--name-only',revision]).split('\n').filter(Boolean)) paths.add(path);
const forbidden = [...paths].filter(path => /(^|\/)(\.env($|\.(?!example$))|credentials[^/]*\.json$)|\.(pem|key)$/i.test(path));
assert.deepEqual(forbidden, [], '추적된 시크릿 파일 경로 발견 (내용 열람 없음)');
// Print filenames only, never matching values. Excludes secret filenames above.
const pattern = 'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|sk-(proj-)?[A-Za-z0-9_-]{40,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----';
const hits = [];
for (const revision of [...revisions, null]) {
  const args = ['grep','-I','-l','-E',pattern]; if (revision) args.push(revision); args.push('--',...paths);
  const found = git(args,[0,1]); if(found) hits.push(found);
}
const staged = git(['grep','--cached','-I','-l','-E',pattern,'--',...paths],[0,1]);
if (staged) hits.push(staged);
assert.deepEqual(hits, [], '시크릿 패턴이 있는 추적 파일 발견 (값 출력 없음)');
console.log(`PASS secrets audit: ${revisions.length} commit(s) + worktree + index, ${paths.size} tracked paths; no secret files or recognized key patterns.`);
