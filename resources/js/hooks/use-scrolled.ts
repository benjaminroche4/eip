import { useEffect, useState } from 'react';

/**
 * True once the window is scrolled past `threshold` px. SSR-safe (false on the server and
 * at hydration), passive listener, one read per animation frame.
 */
export function useScrolled(threshold = 24): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        let frame = 0;
        const read = () => {
            frame = 0;
            setScrolled(window.scrollY > threshold);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(read);
        };

        read();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [threshold]);

    return scrolled;
}
