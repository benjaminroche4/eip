import ViewSwitch from '@/components/properties/view-switch';
import { act, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, sharedProps } from '../inertia';

/** The switch above a list that ends with a closing card, as on « Nos biens ». */
function Page() {
    const end = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<'list' | 'map'>('list');
    return (
        <>
            <div ref={end}>closing card</div>
            <ViewSwitch view={view} onToggle={() => setView((v) => (v === 'map' ? 'list' : 'map'))} until={end} />
        </>
    );
}

function entry(target: Element, isIntersecting: boolean, top: number): IntersectionObserverEntry {
    return { target, isIntersecting, boundingClientRect: { top, bottom: top + 100 } as DOMRectReadOnly } as IntersectionObserverEntry;
}

describe('ViewSwitch', () => {
    const nativeObserver = globalThis.IntersectionObserver;
    afterEach(() => {
        globalThis.IntersectionObserver = nativeObserver;
    });

    it('leaves the list once the closing card is in view or scrolled past, comes back when it drops below, and always stays over the map', () => {
        const callbacks: IntersectionObserverCallback[] = [];
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback) {
                callbacks.push(cb);
            }
            observe() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        render(<Page />);
        const [watch] = callbacks;
        const end = screen.getByText('closing card');
        expect(screen.getByRole('group', { name: 'Affichage des biens' })).toBeInTheDocument();

        act(() => watch([entry(end, true, 500)], {} as IntersectionObserver)); // the CTA card is visible: the switch would cover it
        expect(screen.queryByRole('group', { name: 'Affichage des biens' })).toBeNull();
        act(() => watch([entry(end, false, -300)], {} as IntersectionObserver)); // scrolled past, over the footer: still away
        expect(screen.queryByRole('group', { name: 'Affichage des biens' })).toBeNull();
        act(() => watch([entry(end, false, window.innerHeight + 200)], {} as IntersectionObserver)); // back up the list
        const segment = screen.getByRole('group', { name: 'Affichage des biens' });
        expect(segment).toHaveClass('animate-fade-in', 'motion-reduce:animate-none');

        act(() => screen.getByRole('button', { name: 'Carte' }).click());
        act(() => watch([entry(end, true, 500)], {} as IntersectionObserver)); // the map is full screen: the way back must stay
        expect(screen.getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Carte' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders without IntersectionObserver (SSR-safe, always shown)', () => {
        globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        render(<Page />);
        expect(screen.getByRole('group', { name: 'Affichage des biens' })).toBeInTheDocument();
    });
});
