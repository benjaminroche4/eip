import { type RefObject, useEffect } from 'react';

/**
 * Snap carousel helpers for a horizontal row that overflows (mobile): it opens centred on the middle item, a light
 * swipe or wheel moves to the next item and CSS scroll-snap locks it in the middle, and the mouse can drag it too
 * (snap is suspended while dragging via `data-dragging`, then the nearest item is centred smoothly on release).
 * Listeners are always attached (the row may start overflowing after a resize); nothing happens while the content fits.
 * SSR-safe: everything happens in an effect.
 */
/**
 * `align: 'center'` (default) snaps to item centres and opens on the middle item unless `open: 'first'` (the row's
 * side padding then centres the first item at scroll 0); `'start'` leaves the row at its start and snaps to item starts.
 */
export function useDragScroll(
    ref: RefObject<HTMLElement | null>,
    { align = 'center', open = 'middle' }: { align?: 'center' | 'start'; open?: 'middle' | 'first' } = {},
) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const overflowing = () => el.scrollWidth - el.clientWidth > 1;

        // Open on the middle item — now, and again if the row starts overflowing after a resize (desktop → mobile width).
        let centred = false;
        const centre = () => {
            if (!overflowing() || align !== 'center' || open !== 'middle') {
                centred = false;
                return;
            }
            if (centred) return;
            el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
            centred = true;
        };
        centre();
        window.addEventListener('resize', centre);

        let dragging = false;
        let lastX = 0;

        const nearestItem = () => {
            const items = Array.from(el.children) as HTMLElement[];
            const reference = align === 'center' ? el.scrollLeft + el.clientWidth / 2 : el.scrollLeft;
            let best = el.scrollLeft;
            let bestDistance = Infinity;
            for (const item of items) {
                const edge = align === 'center' ? item.offsetLeft + item.offsetWidth / 2 : item.offsetLeft;
                const distance = Math.abs(edge - reference);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = align === 'center' ? edge - el.clientWidth / 2 : edge;
                }
            }
            return best;
        };

        const onPointerDown = (e: PointerEvent) => {
            // Touch scrolls natively; the mouse (or a pen) drags. Nothing to drag when the row fits.
            if (e.pointerType === 'touch' || !overflowing()) return;
            e.preventDefault();
            dragging = true;
            lastX = e.clientX;
            el.setPointerCapture(e.pointerId);
            el.dataset.dragging = 'true';
        };
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            // Incremental: the row may be recentred by a loop (testimonials) while dragging, the delta stays correct.
            el.scrollLeft -= e.clientX - lastX;
            lastX = e.clientX;
        };
        const onPointerUp = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
            const target = nearestItem();
            delete el.dataset.dragging;
            el.scrollTo({ left: target, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
        return () => {
            window.removeEventListener('resize', centre);
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', onPointerUp);
            el.removeEventListener('pointercancel', onPointerUp);
        };
    }, [ref, align, open]);
}
