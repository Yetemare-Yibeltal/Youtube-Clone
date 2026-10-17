(async () => {
  const load = async (name) => (typeof require === 'function' ? require(name) : import(name));
  const path = await load('node:path');
  const childProcess = await load('node:child_process');

  const rootDir = path.resolve(path.dirname(process.argv[1]), '..');
  const serverDir = path.join(rootDir, 'server');

  const result = childProcess.spawnSync(process.execPath, ['scripts/seed.js', ...process.argv.slice(2)], {
    cwd: serverDir,
    stdio: 'inherit',
  });

  process.exit(result.status === null ? 1 : result.status);
})();