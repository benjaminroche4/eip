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
        let startScroll = 0;
        /** A drag past this many pixels always moves at least one item in its direction (2026-09-22: snapping back to the nearest item read as « the image comes back »). */
        const STEP_THRESHOLD = 24;

        /** Scroll position that puts each item at its snap point (start or centre), in row order. */
        const snapPoints = () =>
            (Array.from(el.children) as HTMLElement[]).map((item) =>
                align === 'center' ? item.offsetLeft + item.offsetWidth / 2 - el.clientWidth / 2 : item.offsetLeft,
            );
        const nearestItem = (from: number = el.scrollLeft) => {
            let best = from;
            let bestDistance = Infinity;
            for (const point of snapPoints()) {
                const distance = Math.abs(point - from);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = point;
                }
            }
            return best;
        };
        /** Release target: the nearest item, but never the one we started from when the drag went further than the threshold. */
        const releaseTarget = () => {
            const delta = el.scrollLeft - startScroll;
            const target = nearestItem();
            if (Math.abs(delta) < STEP_THRESHOLD || Math.abs(target - nearestItem(startScroll)) > 1) return target;
            const points = snapPoints().sort((a, b) => a - b);
            const next = delta > 0 ? points.find((p) => p > target + 1) : [...points].reverse().find((p) => p < target - 1);
            return next ?? target;
        };

        const onPointerDown = (e: PointerEvent) => {
            // Touch scrolls natively; the mouse (or a pen) drags. Nothing to drag when the row fits.
            if (e.pointerType === 'touch' || !overflowing()) return;
            e.preventDefault();
            dragging = true;
            lastX = e.clientX;
            startScroll = el.scrollLeft;
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
            const target = releaseTarget();
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
