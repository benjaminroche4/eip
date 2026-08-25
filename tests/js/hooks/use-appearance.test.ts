import { initializeTheme } from '@/hooks/use-appearance';
import { describe, expect, it, vi } from 'vitest';

describe('initializeTheme', () => {
    it('never applies the dark class, even when the OS prefers dark or a dark preference was saved', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        localStorage.setItem('appearance', 'dark');
        document.documentElement.classList.add('dark');

        initializeTheme();

        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
