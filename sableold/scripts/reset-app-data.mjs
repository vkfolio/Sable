// Wipes Sable's user data so the next launch starts truly fresh.
//
// What it removes:
//   1. Electron userData directory (settings.json, history.json, models/,
//      LocalStorage, IndexedDB, Cache).
//   2. electron-updater cache (Win-only, harmless on others).
//   3. OS keychain entries under the `sable` service (Anthropic / OpenAI
//      keys stored via keytar).
//
// Targets every userData path Sable might have used:
//   - Dev (pnpm shell): scoped package name → `@sable\shell`
//   - Packaged installer: productName → `Sable`
//   - Lowercase + sable-shell variants (defensive)
//
// Usage:
//   pnpm reset           → wipe only
//   pnpm shell:fresh     → wipe + run dev
//
// Cross-platform: handles Windows / macOS / Linux user-data locations.

import { rm, access } from 'node:fs/promises';
import { homedir, platform as osPlatform } from 'node:os';
import path from 'node:path';

const platform = osPlatform();
const home = homedir();

function userDataCandidates() {
  if (platform === 'win32') {
    const appdata = process.env['APPDATA'] ?? path.join(home, 'AppData', 'Roaming');
    const localAppData =
      process.env['LOCALAPPDATA'] ?? path.join(home, 'AppData', 'Local');
    return [
      path.join(appdata, '@sable', 'shell'), // dev pnpm shell (scoped name)
      path.join(appdata, 'sable'),
      path.join(appdata, 'sable-shell'),
      path.join(appdata, 'Sable'), // packaged installer productName
      path.join(localAppData, 'Sable-updater'),
      path.join(localAppData, 'sable-updater'),
    ];
  }
  if (platform === 'darwin') {
    const lib = path.join(home, 'Library', 'Application Support');
    return [
      path.join(lib, '@sable', 'shell'),
      path.join(lib, 'sable'),
      path.join(lib, 'sable-shell'),
      path.join(lib, 'Sable'),
    ];
  }
  const cfg = process.env['XDG_CONFIG_HOME'] ?? path.join(home, '.config');
  return [
    path.join(cfg, '@sable', 'shell'),
    path.join(cfg, 'sable'),
    path.join(cfg, 'sable-shell'),
    path.join(cfg, 'Sable'),
  ];
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function wipeUserData() {
  console.log('Removing Sable userData directories…');
  let cleared = 0;
  for (const dir of userDataCandidates()) {
    if (!(await exists(dir))) continue;
    try {
      await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log('  ✓ removed', dir);
      cleared++;
    } catch (err) {
      console.warn(
        '  ! could not remove',
        dir,
        '—',
        err?.message ?? err,
        '\n    (Sable might still be running. Close it and re-run.)',
      );
    }
  }
  if (cleared === 0) console.log('  (no Sable userData dirs found — already clean)');
}

async function wipeKeychain() {
  console.log('Clearing OS keychain entries (service: sable)…');
  let keytar;
  try {
    keytar = (await import('keytar')).default ?? (await import('keytar'));
  } catch (err) {
    console.warn(
      '  ! keytar not loadable from this script —',
      err?.message ?? err,
    );
    console.warn(
      '    Manual cleanup: open Credential Manager (Win) / Keychain Access (Mac) and delete entries under service "sable".',
    );
    return;
  }
  try {
    const creds = await keytar.findCredentials('sable');
    if (creds.length === 0) {
      console.log('  (no keychain entries — nothing to clear)');
      return;
    }
    for (const c of creds) {
      await keytar.deletePassword('sable', c.account);
      console.log('  ✓ cleared', c.account);
    }
  } catch (err) {
    console.warn('  ! keytar wipe failed:', err?.message ?? err);
  }
}

console.log('Sable · reset-app-data');
console.log('───────────────────────');
await wipeUserData();
await wipeKeychain();
console.log('\nDone. Next `pnpm shell` will start fresh — first-run onboarding will fire.');
