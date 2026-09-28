import PropertyPhotos from '@/components/properties/property-photos';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPage } from '../inertia';

const PHOTOS = ['/a-{w}.webp', '/b-{w}.webp', '/c-{w}.webp'];

describe('PropertyPhotos', () => {
    it('scrolls one photo at a time with the arrows, measured on the scroll position, arrows aria-disabled at the ends', async () => {
        const user = userEvent.setup();
        renderPage(<PropertyPhotos photos={PHOTOS} alt="Salon" title="Loft" />);
        const prev = screen.getByRole('button', { name: 'Photo précédente' });
        const next = screen.getByRole('button', { name: 'Photo suivante' });
        const track = screen.getByRole('group').firstElementChild as HTMLDivElement;
        Object.defineProperty(track, 'clientWidth', { value: 400, configurable: true });
        const scrollTo = vi.fn(({ left }: { left: number }) => {
            track.scrollLeft = left;
            fireEvent.scroll(track);
        });
        track.scrollTo = scrollTo as never;

        expect(prev).toHaveAttribute('aria-disabled', 'true');
        expect(next).not.toHaveAttribute('aria-disabled');
        expect(screen.getByText('Photo 1 sur 3')).toBeInTheDocument();
        expect(track).toHaveClass('cursor-grab', 'snap-x'); // mouse drag via useDragScroll, native swipe on touch
        expect(track.parentElement!.querySelector('.rounded-full.bg-black\\/30')).not.toBeNull(); // dots on a dark pill

        await user.click(next);
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 400, behavior: 'smooth' });
        expect(screen.getByText('Photo 2 sur 3')).toBeInTheDocument();
        await user.click(next);
        expect(screen.getByText('Photo 3 sur 3')).toBeInTheDocument();
        expect(next).toHaveAttribute('aria-disabled', 'true');
        await user.click(next); // at the end: nothing happens, the focus stays
        expect(scrollTo).toHaveBeenCalledTimes(2);
        expect(next).toHaveFocus();

        // A swipe (native scroll) is measured the same way
        track.scrollLeft = 0;
        fireEvent.scroll(track);
        expect(prev).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByText('Photo 1 sur 3')).toBeInTheDocument();
    });
});
