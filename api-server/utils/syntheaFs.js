import path from 'path';
import fs from 'fs/promises';

/**
 * List a directory once, returning directories and files arrays.
 */
export async function listDirOnce(dir) {
  try {
    const ents = await fs.readdir(dir, { withFileTypes: true });
    return {
      ok: true,
      dirs: ents.filter(e => e.isDirectory()).map(e => ({ name: e.name, path: path.join(dir, e.name) })),
      files: ents.filter(e => e.isFile()).map(e => ({ name: e.name, path: path.join(dir, e.name) })),
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Preview a few JSON files under dir and its subdirectories.
 */
export async function previewJsonFiles(dir, limitDirs = 3, limitFiles = 3) {
  const previews = [];
  const first = await listDirOnce(dir);
  if (!first.ok) return { dir, error: first.error, previews };
  const subdirs = first.dirs.slice(0, limitDirs);
  for (const sd of subdirs) {
    const sub = await listDirOnce(sd.path);
    if (!sub.ok) continue;
    const jsons = sub.files.filter(f => f.name.toLowerCase().endsWith('.json')).slice(0, limitFiles);
    for (const jf of jsons) {
      try {
        const raw = await fs.readFile(jf.path, 'utf8');
        const head = raw.split('\n').slice(0, 10).join('\n');
        previews.push({ dir: sd.path, file: jf.name, head });
      } catch {
        // ignore
      }
    }
  }
  // Also check JSON files directly at root of dir
  const rootJsons = first.files.filter(f => f.name.toLowerCase().endsWith('.json')).slice(0, limitFiles);
  for (const rj of rootJsons) {
    try {
      const raw = await fs.readFile(rj.path, 'utf8');
      const head = raw.split('\n').slice(0, 10).join('\n');
      previews.push({ dir, file: rj.name, head });
    } catch { /* ignore */ }
  }
  return { dir, previews };
}

/**
 * Read mount information from the container, returning the first available file
 * among /proc/self/mountinfo or /etc/mtab with initial lines.
 */
export async function readMounts() {
  const files = ['/proc/self/mountinfo', '/etc/mtab'];
  for (const f of files) {
    try {
      const t = await fs.readFile(f, 'utf8');
      return { file: f, lines: t.split('\n').slice(0, 60) };
    } catch {
      // try next
    }
  }
  return { file: null, lines: [] };
}
