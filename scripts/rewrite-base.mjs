import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const raw = process.env.BASE_PATH || '/';
const base = raw === '/' ? '/' : `/${raw.replace(/^\/+|\/+$/g, '')}/`;

if (base === '/') {
  console.log('BASE_PATH=/, geen herschrijving nodig');
  process.exit(0);
}

let files = 0;
for (const entry of fs.readdirSync(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = path.join(entry.parentPath ?? entry.path, entry.name);
  const rel = path.relative(dist, file);
  if (rel.endsWith('.html')) {
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(/(\s(?:href|src|poster|action)=")\/(?!\/)/g, `$1${base}`);
    if (after !== before) { fs.writeFileSync(file, after); files++; }
  } else if (rel.endsWith('.css')) {
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(/url\(\s*(["']?)\/(?!\/)/g, `url($1${base}`);
    if (after !== before) { fs.writeFileSync(file, after); files++; }
  }
}
console.log(`BASE_PATH=${base}: ${files} bestanden herschreven`);
