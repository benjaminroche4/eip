import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            output: {
                // Lighthouse 2026-10-12: every lucide icon and Radix primitive shipped as its own 0-1 KB chunk, a 50-request
                // critical chain. Icons go in one shared chunk.
                // Never add `experimentalMinChunkSize`: Rollup then merges small page modules into other chunks and they lose
                // their manifest entry, so `@vite("resources/js/pages/{component}.tsx")` throws in production (2026-10-13:
                // blog, sell, buy, about, newsletter, sitemap and the error page were 500 for a day — hidden locally by the
                // dev server). `scripts/check-vite-manifest.mjs` fails the build if a page is missing from the manifest.
                manualChunks(id) {
                    if (id.includes('node_modules/lucide-react')) return 'icons';
                    return undefined; // Radix stays split per page: one shared chunk would load 53 KB gzip everywhere
                },
            },
        },
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(import.meta.dirname, 'vendor/tightenco/ziggy'),
        },
    },
});