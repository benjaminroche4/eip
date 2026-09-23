import { useDragScroll } from '@/hooks/use-drag-scroll';
import { act, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** A three-item snap row, as the carousels use it. */
function Row() {
    const ref = useRef<HTMLUListElement>(null);
    useDragScroll(ref, { align: 'center', open: 'first' });
    return (
        <ul ref={ref} data-testid="row">
            <li>
                <a href="/a">
                    <img src="/a.jpg" alt="" />
                </a>
            </li>
            <li>b</li>
            <li>c</li>
        </ul>
    );
}

/** jsdom has no layout: give the row an overflow so a drag is accepted. */
function overflow(row: HTMLElement) {
    Object.defineProperty(row, 'scrollWidth', { value: 1200, configurable: true });
    Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true });
}

describe('useDragScroll', () => {
    const scrollTo = vi.fn();
    beforeEach(() => {
        window.HTMLElement.prototype.scrollTo = scrollTo;
        scrollTo.mockClear();
    });
    afterEach(() => {
        vi.useRealTimers();
        delete (window as { onscrollend?: unknown }).onscrollend;
    });

    it('blocks the native drag of images and links while the row is being dragged (2026-09-22)', () => {
        const { getByTestId } = render(<Row />);
        const row = getByTestId('row');
        overflow(row);
        const img = row.querySelector('img')!;

        // Not dragging: a native drag is left alone
        expect(fireEvent.dragStart(img)).toBe(true);

        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        expect(row).toHaveAttribute('data-dragging', 'true');
        expect(fireEvent.dragStart(img)).toBe(false); // prevented
    });

    it('keeps data-dragging until the release scroll has ended: 400 ms fallback without scrollend (2026-09-22)', () => {
        vi.useFakeTimers();
        const { getByTestId, unmount } = render(<Row />);
        const row = getByTestId('row');
        overflow(row);

        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        fireEvent.pointerMove(row, { clientX: 40, pointerType: 'mouse', pointerId: 1 });
        expect(row.scrollLeft).toBe(60);
        fireEvent.pointerUp(row, { clientX: 40, pointerType: 'mouse', pointerId: 1 });
        expect(scrollTo).toHaveBeenCalledTimes(1);
        expect(row).toHaveAttribute('data-dragging', 'true'); // the snap is not re-enabled mid-glide

        act(() => {
            vi.advanceTimersByTime(399);
        });
        expect(row).toHaveAttribute('data-dragging', 'true');
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(row).not.toHaveAttribute('data-dragging');

        // Unmount while a release is pending: the timer is cancelled (no late write on a detached row)
        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        fireEvent.pointerUp(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        unmount();
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(row).toHaveAttribute('data-dragging', 'true');
    });

    it('removes data-dragging on scrollend where the browser supports it, and not before', () => {
        vi.useFakeTimers();
        (window as { onscrollend?: unknown }).onscrollend = null; // feature detection
        const { getByTestId } = render(<Row />);
        const row = getByTestId('row');
        overflow(row);

        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        fireEvent.pointerUp(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        expect(row).toHaveAttribute('data-dragging', 'true');
        act(() => {
            row.dispatchEvent(new Event('scrollend'));
        });
        expect(row).not.toHaveAttribute('data-dragging');

        // A new drag started before the previous release settles is not cut short by the late settle
        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        fireEvent.pointerUp(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 });
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(row).toHaveAttribute('data-dragging', 'true');
    });

    it('ignores touch and rows that fit', () => {
        const { getByTestId } = render(<Row />);
        const row = getByTestId('row');

        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'mouse', pointerId: 1 }); // no overflow (jsdom): nothing to drag
        expect(row).not.toHaveAttribute('data-dragging');
        overflow(row);
        fireEvent.pointerDown(row, { clientX: 100, pointerType: 'touch', pointerId: 2 }); // touch scrolls natively
        expect(row).not.toHaveAttribute('data-dragging');
    });
});
