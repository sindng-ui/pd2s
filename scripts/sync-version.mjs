// C:/AntigravityWorkspace/pd2s/scripts/sync-version.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. package.json 읽기
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;

if (!version) {
  console.error('[sync-version] Error: No version found in package.json');
  process.exit(1);
}

console.log(`[sync-version] Syncing target version: ${version}`);

// 2. src-tauri/tauri.conf.json 업데이트
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  let updated = false;
  if (tauriConf.version !== undefined) {
    tauriConf.version = version;
    updated = true;
  }
  if (tauriConf.package && tauriConf.package.version !== undefined) {
    tauriConf.package.version = version;
    updated = true;
  }
  if (updated) {
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf-8');
    console.log(`[sync-version] Updated src-tauri/tauri.conf.json -> ${version}`);
  }
}

// 3. src-tauri/Cargo.toml 업데이트
const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargoContent = fs.readFileSync(cargoPath, 'utf-8');
  // version = "x.y.z" 패턴 치환
  const updatedCargo = cargoContent.replace(
    /(\[package\][\s\S]*?\nversion\s*=\s*)"[^"]+"/,
    `$1"${version}"`
  );
  fs.writeFileSync(cargoPath, updatedCargo, 'utf-8');
  console.log(`[sync-version] Updated src-tauri/Cargo.toml -> ${version}`);
}

console.log('[sync-version] Version synchronization complete!');
