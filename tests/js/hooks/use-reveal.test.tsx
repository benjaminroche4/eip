import { useReveal } from '@/hooks/use-reveal';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

function Probe({ offset }: { offset?: '-10%' | '-15%' }) {
    const ref = useRef<HTMLDivElement>(null);
    const revealed = useReveal(ref, offset);
    return <div ref={ref}>{revealed ? 'revealed' : 'hidden'}</div>;
}

describe('useReveal', () => {
    const nativeObserver = globalThis.IntersectionObserver;
    afterEach(() => {
        globalThis.IntersectionObserver = nativeObserver;
    });

    it('reveals right away without IntersectionObserver (SSR, jsdom, old browsers)', () => {
        render(<Probe />);
        expect(screen.getByText('revealed')).toBeInTheDocument();
    });

    it('waits for the element to enter the viewport, fires once with the given bottom margin, then disconnects', () => {
        const callbacks: IntersectionObserverCallback[] = [];
        const options: IntersectionObserverInit[] = [];
        let disconnected = 0;
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
                callbacks.push(cb);
                options.push(init ?? {});
            }
            observe() {}
            unobserve() {}
            disconnect() {
                disconnected += 1;
            }
        } as unknown as typeof IntersectionObserver;

        render(<Probe offset="-15%" />);
        expect(screen.getByText('hidden')).toBeInTheDocument();
        expect(options[0].rootMargin).toBe('0px 0px -15% 0px');

        act(() => callbacks[0]([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(screen.getByText('hidden')).toBeInTheDocument();

        act(() => callbacks[0]([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
        expect(screen.getByText('revealed')).toBeInTheDocument();
        expect(disconnected).toBeGreaterThanOrEqual(1); // fired once, then stopped watching
    });
});
