// Fails the build when a page is missing from the Vite manifest.
//
// `app.blade.php` asks `@vite` for `resources/js/pages/{component}.tsx` on every request. Rollup only writes a manifest
// entry for a module that is the facade of its own chunk: an option like `experimentalMinChunkSize` (or a manualChunks
// rule that swallows pages) merges small pages into other chunks and Laravel throws « Unable to locate file in Vite
// manifest » in production, while the dev server hides it locally (2026-10-13 incident: six pages and the error page
// answered 500 for a day). Run after `vite build`, before the SSR build, so a broken manifest never reaches a deploy.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = new URL('..', import.meta.url).pathname;
const pagesDir = join(root, 'resources/js/pages');
const manifestPath = join(root, 'public/build/manifest.json');

const pages = [];
const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        const file = join(dir, name);
        if (statSync(file).isDirectory()) walk(file);
        else if (name.endsWith('.tsx')) pages.push(relative(root, file));
    }
};
walk(pagesDir);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const missing = pages.filter((page) => !manifest[page]);

if (missing.length > 0) {
    console.error(`✗ ${missing.length} page(s) missing from public/build/manifest.json (they would answer 500 in production):`);
    for (const page of missing) console.error(`  - ${page}`);
    process.exit(1);
}

console.log(`✓ Vite manifest: ${pages.length} pages present`);
