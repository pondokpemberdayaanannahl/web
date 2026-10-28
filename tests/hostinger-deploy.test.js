import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join, relative, isAbsolute } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const checker = join(root, 'scripts/check-hostinger-build.mjs');
const workflow = readFileSync(join(root, '.github/workflows/hostinger.yml'), 'utf8').replace(/\r\n/g, '\n');
const publication = workflow.split('        run: |\n').at(-1).split('\n').map(line => line.replace(/^ {10}/, '')).join('\n');
const fixtureRoot = join(root, '.backend-backups', 'deployment-tests');
mkdirSync(fixtureRoot, { recursive: true });
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const bash = process.platform === 'win32'
  ? resolve(git(root, '--exec-path'), '../../../bin/bash.exe') : '/bin/bash';

function fixture() {
  const folder = mkdtempSync(join(fixtureRoot, 'release-'));
  const repository = join(folder, 'source');
  const remote = join(folder, 'remote.git');
  const temp = join(folder, 'runner-temp');
  mkdirSync(repository); mkdirSync(temp);
  git(folder, 'init', '--bare', '--initial-branch=main', remote);
  git(repository, 'init', '--initial-branch=main');
  git(repository, 'config', 'user.name', 'Offline test');
  git(repository, 'config', 'user.email', 'offline@example.invalid');
  writeFileSync(join(repository, '.gitignore'), 'dist/\n.env\n');
  writeFileSync(join(repository, '.env'), 'PRIVATE_TEST_VALUE=must-stay-local');
  writeFileSync(join(repository, 'source-only.txt'), 'This source must not be published.');
  git(repository, 'add', '.');
  git(repository, 'commit', '-m', 'Test source');
  git(repository, 'remote', 'add', 'origin', remote);
  git(repository, 'push', 'origin', 'main');
  const dist = join(repository, 'dist');
  for (const name of ['assets', 'api', 'media']) mkdirSync(join(dist, name), { recursive: true });
  const html = '<script type="module" src="/assets/app-test.js"></script>';
  for (const name of ['index.html', 'admin.html', 'login.html']) writeFileSync(join(dist, name), html);
  writeFileSync(join(dist, '.htaccess'), 'DirectoryIndex index.html\n');
  writeFileSync(join(dist, 'assets/app-test.js'), 'console.log("built");');
  for (const name of ['forms.php', 'forms-core.php','media.php','media-image.php','media-core.php']) writeFileSync(join(dist, 'api', name), '<?php // fixture');
  const sha = git(repository, 'rev-parse', 'HEAD');
  return {
    repository, remote, dist, sha,
    publish(source = sha) {
      return execFileSync(bash, ['-c', publication], {
        cwd: repository, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GITHUB_WORKSPACE: repository.replaceAll('\\', '/'), GITHUB_SHA: source, RUNNER_TEMP: temp.replaceAll('\\', '/') },
      });
    },
    cleanup() {
      const child = relative(fixtureRoot, folder);
      assert.ok(child && !child.startsWith('..') && !isAbsolute(child));
      rmSync(folder, { recursive: true, force: true });
    },
  };
}

test('Hostinger publication ships only dist, preserves main/index and release history, and skips stale builds', () => {
  const f = fixture();
  try {
    const originalIndex = readFileSync(join(f.repository, '.git/index'));
    f.publish();
    assert.deepEqual(git(f.remote, 'ls-tree', '-r', '--name-only', 'hostinger').split('\n'), [
      '.htaccess', 'admin.html', 'api/forms-core.php', 'api/forms.php', 'api/media-core.php', 'api/media-image.php', 'api/media.php', 'assets/app-test.js', 'index.html', 'login.html',
    ]);
    const first = git(f.remote, 'rev-parse', 'hostinger');
    assert.equal(git(f.remote, 'rev-parse', 'main'), f.sha);
    assert.deepEqual(readFileSync(join(f.repository, '.git/index')), originalIndex);
    assert.match(f.publish(), /sudah sama/);
    assert.equal(git(f.remote, 'rev-parse', 'hostinger'), first);

    rmSync(join(f.dist, 'assets/app-test.js'));
    writeFileSync(join(f.dist, 'assets/app-new.js'), 'console.log("new build");');
    f.publish();
    const second = git(f.remote, 'rev-parse', 'hostinger');
    assert.equal(git(f.remote, 'rev-parse', 'hostinger^'), first);
    assert.match(git(f.remote, 'ls-tree', '-r', '--name-only', 'hostinger'), /assets\/app-new.js/);
    assert.doesNotMatch(git(f.remote, 'ls-tree', '-r', '--name-only', 'hostinger'), /app-test\.js/);

    writeFileSync(join(f.repository, 'source-only.txt'), 'A newer source commit.');
    git(f.repository, 'add', 'source-only.txt');
    git(f.repository, 'commit', '-m', 'Newer source');
    git(f.repository, 'push', 'origin', 'main');
    assert.match(f.publish(f.sha), /lebih baru/);
    assert.equal(git(f.remote, 'rev-parse', 'hostinger'), second);
  } finally { f.cleanup(); }
});

test('Hostinger build check rejects source HTML, missing assets, and private configuration', () => {
  const f = fixture();
  const check = () => spawnSync(process.execPath, [checker, f.dist], { encoding: 'utf8' });
  try {
    assert.equal(check().status, 0);
    const index = join(f.dist, 'index.html');
    const built = readFileSync(index, 'utf8');
    writeFileSync(index, '<script type="module" src="/src/bootstrap.js"></script>');
    assert.notEqual(check().status, 0);
    writeFileSync(index, built);
    rmSync(join(f.dist, 'assets/app-test.js'));
    assert.notEqual(check().status, 0);
    writeFileSync(join(f.dist, 'assets/app-test.js'), 'console.log("built");');
    writeFileSync(join(f.dist, '.env'), 'PRIVATE_TEST_VALUE=must-not-be-published');
    const privateResult = check();
    assert.notEqual(privateResult.status, 0);
    assert.doesNotMatch(privateResult.stderr, /must-not-be-published/);
  } finally { f.cleanup(); }
});

test('Hostinger environment check requires public keys without echoing key values', () => {
  const check = key => spawnSync(process.execPath, [checker, '--env'], {
    encoding: 'utf8', env: { ...process.env, VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: key },
  });
  const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  for (const key of ['', 'sb_secret_test_value', jwt('service_role'), 'placeholder']) {
    const result = check(key);
    assert.notEqual(result.status, 0);
    if (key) assert.ok(!(result.stdout + result.stderr).includes(key));
  }
  for (const key of ['sb_publishable_test_value', jwt('anon')]) assert.equal(check(key).status, 0);
});
