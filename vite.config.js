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
                // critical chain. Icons go in one shared chunk; Rollup merges anything still under 20 KB.
                manualChunks(id) {
                    if (id.includes('node_modules/lucide-react')) return 'icons';
                    return undefined; // Radix stays split per page: one shared chunk would load 53 KB gzip everywhere
                },
                experimentalMinChunkSize: 20000,
            },
        },
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(import.meta.dirname, 'vendor/tightenco/ziggy'),
        },
    },
});