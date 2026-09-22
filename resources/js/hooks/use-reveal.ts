import { type RefObject, useEffect, useState } from 'react';

/**
 * True once the element behind `ref` has entered the viewport, and stays true: the trigger of every
 * "reveal on scroll" cascade of the public site (`animate-hero-rise`, `animate-manifesto-in` + `--stagger`).
 * The observer fires once, slightly before the element's bottom edge (`offset` = bottom root margin, `-10%` by default,
 * `-15%` for the larger blocks), then disconnects. Without `IntersectionObserver` (SSR, jsdom, old browsers) the
 * element is revealed right away, so nothing is ever left invisible. SSR-safe: everything lives in an effect.
 */
export function useReveal<T extends Element>(ref: RefObject<T | null>, offset: '-10%' | '-15%' = '-10%'): boolean {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setRevealed(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { rootMargin: `0px 0px ${offset} 0px` },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, offset]);

    return revealed;
}
