const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const KEEP_ROOT = new Set([
  'portfolio.html',
  'vercel.json',
  'logo-tg.png',
  'sign-tanya.png',
  '.gitignore',
  '.gitattributes',
]);

const ACTIVE_IMAGES = new Set([
  path.join('images', 'hero', 'chapka-21x9-active.jpg'),
  path.join('images', 'islands', 'icon-vizual.png'),
  path.join('images', 'islands', 'icon-video.png'),
  path.join('images', 'islands', 'icon-content.png'),
  path.join('images', 'islands', 'icon-vibe-coding.png'),
  path.join('images', 'islands', 'icon-gpt-agent.png'),
  path.join('images', 'islands', 'music.png'),
]);

const DIRS = [
  'archive/phase1-backup',
  'archive/phase2-backup',
  'archive/phase3a-backup',
  'archive/root-snapshots',
  'archive/root-snapshots/root-inactive-after-3a',
  'archive/old-images/hero-working-copies',
  'archive/old-images/ui-working-copies',
  'archive/old-images/portfolio-working-copies',
  'archive/old-images/qa-root-duplicates',
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) {
    const base = path.basename(dest);
    const stamp = Date.now();
    dest = path.join(path.dirname(dest), `${stamp}__${base}`);
  }
  fs.renameSync(src, dest);
  return path.relative(ROOT, dest).replace(/\\/g, '/');
}

function fileExistsInArchive(basename) {
  const archiveRoot = path.join(ROOT, 'archive');
  let found = false;
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === 'root-inactive-after-3a' || e.name === 'hero-working-copies' || e.name === 'ui-working-copies' || e.name === 'portfolio-working-copies' || e.name === 'qa-root-duplicates') continue;
        walk(full);
      } else if (e.name === basename) {
        found = true;
      }
    }
  }
  walk(archiveRoot);
  return found;
}

function isQaDuplicate(name) {
  const qa = path.join(ROOT, 'docs', 'qa', name);
  if (fs.existsSync(qa)) return true;
  const frames = path.join(ROOT, 'docs', 'qa', 'luxury-gif-frames', name);
  return fs.existsSync(frames);
}

const log = { moved: [], skipped: [], reorganized: [] };

// 1. Create structure
for (const d of DIRS) ensureDir(path.join(ROOT, d));

// 2. Reorganize phase1 root-snapshot -> root-snapshots/phase1-root-snapshot
const oldSnapshot = path.join(ROOT, 'archive', 'old-images', 'root-snapshot');
const newSnapshot = path.join(ROOT, 'archive', 'root-snapshots', 'phase1-root-snapshot');
if (fs.existsSync(oldSnapshot) && !fs.existsSync(newSnapshot)) {
  fs.renameSync(oldSnapshot, newSnapshot);
  log.reorganized.push('archive/old-images/root-snapshot -> archive/root-snapshots/phase1-root-snapshot');
}

// 3. Move inactive root files (duplicated in archive or docs/qa or images/)
for (const name of fs.readdirSync(ROOT)) {
  const src = path.join(ROOT, name);
  if (!fs.statSync(src).isFile()) continue;
  if (KEEP_ROOT.has(name)) continue;

  const dupInArchive = fileExistsInArchive(name);
  const dupInDocs = isQaDuplicate(name);
  const dupInImages =
    fs.existsSync(path.join(ROOT, 'images', 'hero', name)) ||
    fs.existsSync(path.join(ROOT, 'images', 'ui', name)) ||
    fs.existsSync(path.join(ROOT, 'images', 'portfolio', name));

  if (!dupInArchive && !dupInDocs && !dupInImages) {
    log.skipped.push({ file: name, reason: 'no duplicate found in archive/docs/images' });
    continue;
  }

  let destDir = path.join(ROOT, 'archive', 'root-snapshots', 'root-inactive-after-3a');
  if (dupInDocs && /header-(anim|luxury)|luxury|preview\.gif/i.test(name)) {
    destDir = path.join(ROOT, 'archive', 'old-images', 'qa-root-duplicates');
  }

  const dest = moveFile(src, path.join(destDir, name));
  log.moved.push({ from: name, to: dest, reason: 'root inactive duplicate' });
}

// 4. Move inactive images/hero (keep active chapka)
const heroDir = path.join(ROOT, 'images', 'hero');
if (fs.existsSync(heroDir)) {
  for (const name of fs.readdirSync(heroDir)) {
    const rel = path.join('images', 'hero', name);
    if (ACTIVE_IMAGES.has(rel)) continue;
    const src = path.join(heroDir, name);
    if (!fs.statSync(src).isFile()) continue;
    if (!fileExistsInArchive(name) && !fs.existsSync(path.join(ROOT, 'archive', 'root-snapshots', 'root-inactive-after-3a', name))) {
      log.skipped.push({ file: rel, reason: 'no archive duplicate for hero variant' });
      continue;
    }
    const dest = moveFile(src, path.join(ROOT, 'archive', 'old-images', 'hero-working-copies', name));
    log.moved.push({ from: rel.replace(/\\/g, '/'), to: dest, reason: 'images/hero inactive duplicate' });
  }
}

// 5. Move all images/ui (active logos stay in root)
const uiDir = path.join(ROOT, 'images', 'ui');
if (fs.existsSync(uiDir)) {
  for (const name of fs.readdirSync(uiDir)) {
    const src = path.join(uiDir, name);
    if (!fs.statSync(src).isFile()) continue;
    const dup = fileExistsInArchive(name) || KEEP_ROOT.has(name) || fs.existsSync(path.join(ROOT, 'archive', 'root-snapshots', 'root-inactive-after-3a', name));
    if (!dup) {
      log.skipped.push({ file: `images/ui/${name}`, reason: 'no duplicate' });
      continue;
    }
    const dest = moveFile(src, path.join(ROOT, 'archive', 'old-images', 'ui-working-copies', name));
    log.moved.push({ from: `images/ui/${name}`, to: dest, reason: 'images/ui duplicate' });
  }
}

// 6. Move images/portfolio
const portDir = path.join(ROOT, 'images', 'portfolio');
if (fs.existsSync(portDir)) {
  for (const name of fs.readdirSync(portDir)) {
    const src = path.join(portDir, name);
    if (!fs.statSync(src).isFile()) continue;
    if (!fileExistsInArchive(name)) {
      log.skipped.push({ file: `images/portfolio/${name}`, reason: 'no archive duplicate' });
      continue;
    }
    const dest = moveFile(src, path.join(ROOT, 'archive', 'old-images', 'portfolio-working-copies', name));
    log.moved.push({ from: `images/portfolio/${name}`, to: dest, reason: 'images/portfolio duplicate' });
  }
}

// 7. Phase manifests
const phase1 = `# Phase 1 Backup Manifest\n\nCommit: 4f0352a\nDate: 2026-06-08\n\nСоздана структура images/, video/, js/, docs/, archive/.\nАктивные файлы оставлены в корне, организованные копии в images/ и js/.\nПолный снимок корня: archive/root-snapshots/phase1-root-snapshot/\n`;
fs.writeFileSync(path.join(ROOT, 'archive', 'phase1-backup', 'MANIFEST.md'), phase1);
if (fs.existsSync(path.join(ROOT, 'docs', 'FILE-MAP.md'))) {
  fs.copyFileSync(path.join(ROOT, 'docs', 'FILE-MAP.md'), path.join(ROOT, 'archive', 'phase1-backup', 'FILE-MAP.md'));
}

const phase2 = `# Phase 2 Backup Manifest\n\nCommits: 1dc7e7f, b8c6773\nDate: 2026-06-12\n\nОбновлены пути в portfolio.html:\n- images/hero/chapka-21x9-active.jpg\n- images/islands/icon-*.png, music.png\n- js/splash-cursor.js\n\nHTML, дизайн и анимации не менялись.\n`;
fs.writeFileSync(path.join(ROOT, 'archive', 'phase2-backup', 'MANIFEST.md'), phase2);

const phase3a = `# Phase 3A Backup Manifest\n\nCommit: eda33f03b2c1778fb4256a1ccafbb1cd2ec3e029\nDate: 2026-06-12\n\nУдалены из корня (копии сохранены):\n\n| Файл | Резервная копия |\n|------|------------------|\n| chapka 21 на 9.jpg | images/hero/chapka-21x9-active.jpg, archive/root-snapshots/phase1-root-snapshot/ |\n| icon-vizual.png | images/islands/icon-vizual.png |\n| icon-video.png | images/islands/icon-video.png |\n| icon-content.png | images/islands/icon-content.png |\n| icon-vibe-coding.png | images/islands/icon-vibe-coding.png |\n| icon-gpt-agent.png | images/islands/icon-gpt-agent.png |\n| music.png | images/islands/music.png |\n| splash-cursor.js | js/splash-cursor.js |\n| anim-check.js | js/anim-check.js |\n`;
fs.writeFileSync(path.join(ROOT, 'archive', 'phase3a-backup', 'MANIFEST.md'), phase3a);

fs.writeFileSync(path.join(ROOT, 'docs', 'qa', 'archive-run-log.json'), JSON.stringify(log, null, 2));
console.log(JSON.stringify({ moved: log.moved.length, skipped: log.skipped.length, reorganized: log.reorganized }, null, 2));
if (log.skipped.length) console.log('SKIPPED:', JSON.stringify(log.skipped, null, 2));
