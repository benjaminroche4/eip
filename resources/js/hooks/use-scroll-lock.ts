import { useEffect } from 'react';

/**
 * Locks the page scroll while `active` (bottom sheets that are not modal, full-screen map): the body is pinned at the
 * current scroll offset (`position: fixed` works on iOS where `overflow: hidden` alone does not) and the page is put
 * back exactly where it was on release. SSR-safe: nothing runs outside the browser. (Estimate recap bug, 2026-10-11:
 * the sticky submit bar rode away with the end of the form while the fixed recap stayed put.)
 */
export function useScrollLock(active: boolean) {
    useEffect(() => {
        if (!active) return;
        const { body } = document;
        const scrollY = window.scrollY;
        const previous = {
            position: body.style.position,
            top: body.style.top,
            left: body.style.left,
            right: body.style.right,
            overflow: body.style.overflow,
        };
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.overflow = 'hidden';
        return () => {
            Object.assign(body.style, previous);
            window.scrollTo({ top: scrollY, behavior: 'auto' });
        };
    }, [active]);
}
