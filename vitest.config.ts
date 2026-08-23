import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Component tests (Testing Library + axe) — see tests/js/. Separate from vite.config.js to keep Laravel/Vite untouched. */
export default defineConfig({
    esbuild: { jsx: 'automatic' },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
            'ziggy-js': fileURLToPath(new URL('./vendor/tightenco/ziggy', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/js/**/*.test.{ts,tsx}'],
        setupFiles: ['tests/js/setup.ts'],
        globalSetup: ['tests/js/global-setup.ts'],
        css: false,
        restoreMocks: true,
    },
});
