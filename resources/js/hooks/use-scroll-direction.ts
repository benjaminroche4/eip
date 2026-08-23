import { useEffect, useState } from 'react';

type Direction = 'up' | 'down';

/**
 * Scroll direction with hysteresis: flips to "down" only after `delta` px of downward travel
 * (and never within the first `topOffset` px), back to "up" on any upward travel. SSR-safe.
 */
export function useScrollDirection({ delta = 8, topOffset = 72 }: { delta?: number; topOffset?: number } = {}): Direction {
    const [direction, setDirection] = useState<Direction>('up');

    useEffect(() => {
        let last = window.scrollY;
        let frame = 0;

        const read = () => {
            frame = 0;
            const y = window.scrollY;
            const diff = y - last;
            if (y <= topOffset || diff < 0) setDirection('up');
            else if (diff > delta) setDirection('down');
            if (Math.abs(diff) > delta || y <= topOffset) last = y;
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(read);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [delta, topOffset]);

    return direction;
}
