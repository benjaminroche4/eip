import { useScrollLock } from '@/hooks/use-scroll-lock';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('useScrollLock', () => {
    afterEach(() => {
        document.body.removeAttribute('style');
        vi.restoreAllMocks();
    });

    it('pins the body at the current scroll offset while active and puts the page back on release', () => {
        Object.defineProperty(window, 'scrollY', { value: 480, configurable: true });
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        const { rerender, unmount } = renderHook(({ active }) => useScrollLock(active), { initialProps: { active: false } });
        expect(document.body.style.position).toBe('');

        rerender({ active: true });
        expect(document.body.style.position).toBe('fixed');
        expect(document.body.style.top).toBe('-480px');
        expect(document.body.style.overflow).toBe('hidden');

        rerender({ active: false });
        expect(document.body.style.position).toBe('');
        expect(document.body.style.top).toBe('');
        expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: 'auto' });

        unmount();
    });
});
