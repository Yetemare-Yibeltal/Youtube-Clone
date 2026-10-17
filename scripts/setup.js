(async () => {
  const load = async (name) => (typeof require === 'function' ? require(name) : import(name));
  const fs = await load('node:fs');
  const path = await load('node:path');
  const crypto = await load('node:crypto');
  const childProcess = await load('node:child_process');

  const rootDir = path.resolve(path.dirname(process.argv[1]), '..');
  const shouldInstall = process.argv.includes('--install');
  const SECRET_KEYS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];

  function log(message) {
    process.stdout.write(`${message}\n`);
  }

  function ensureNodeVersion() {
    const major = Number(process.versions.node.split('.')[0]);
    if (major < 18) {
      log(`Node.js 18 or newer is required. You are running ${process.versions.node}.`);
      process.exit(1);
    }
  }

  function copyEnvFile(folder) {
    const target = path.join(rootDir, folder, '.env');
    const example = path.join(rootDir, folder, '.env.example');

    if (fs.existsSync(target)) {
      log(`${folder}/.env already exists, leaving it untouched`);
      return target;
    }
    if (!fs.existsSync(example)) {
      log(`${folder}/.env.example was not found, skipping`);
      return null;
    }

    fs.copyFileSync(example, target);
    log(`Created ${folder}/.env from ${folder}/.env.example`);
    return target;
  }

  function generateSecrets(envPath) {
    let content = fs.readFileSync(envPath, 'utf8');
    let replaced = 0;

    for (const key of SECRET_KEYS) {
      const pattern = new RegExp(`^(${key}=)(change_this\\w*)?\\s*$`, 'm');
      if (pattern.test(content)) {
        content = content.replace(pattern, `$1${crypto.randomBytes(32).toString('hex')}`);
        replaced += 1;
      }
    }

    if (replaced > 0) {
      fs.writeFileSync(envPath, content);
      log(`Generated ${replaced} random secret(s) in server/.env`);
    }
  }

  function installDependencies(folder) {
    log(`Installing dependencies in ${folder}...`);
    const result = childProcess.spawnSync('npm', ['install'], {
      cwd: path.join(rootDir, folder),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (result.status !== 0) {
      log(`npm install failed in ${folder}`);
      process.exit(result.status || 1);
    }
  }

  ensureNodeVersion();

  const serverEnv = copyEnvFile('server');
  copyEnvFile('client');
  if (serverEnv) generateSecrets(serverEnv);

  if (shouldInstall) {
    installDependencies('server');
    installDependencies('client');
  }

  log('');
  log('Next steps:');
  log('  1. Open server/.env and set MONGODB_URI, the CLOUDINARY_* values and the SMTP_* values.');
  if (!shouldInstall) log('  2. Run "npm install" inside server and client (or rerun this script with --install).');
  log('  3. Start the API:      cd server && npm run dev');
  log('  4. Start the client:   cd client && npm run dev');
  log('  5. Optional demo data: node scripts/seed.js');
})();