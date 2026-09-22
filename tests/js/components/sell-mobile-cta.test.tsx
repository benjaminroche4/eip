import SellMobileCta from '@/components/sell/sell-mobile-cta';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, sharedProps } from '../inertia';

/** The bar between a hero and a closing card, as on the « Vendre » page. */
function Page() {
    const hero = useRef<HTMLDivElement>(null);
    const end = useRef<HTMLDivElement>(null);
    return (
        <>
            <div ref={hero}>hero</div>
            <div ref={end}>closing card</div>
            <SellMobileCta after={hero} until={end} />
        </>
    );
}

function entry(target: Element, isIntersecting: boolean, bottom: number): IntersectionObserverEntry {
    return { target, isIntersecting, boundingClientRect: { bottom } as DOMRectReadOnly } as IntersectionObserverEntry;
}

describe('SellMobileCta', () => {
    const nativeObserver = globalThis.IntersectionObserver;
    afterEach(() => {
        globalThis.IntersectionObserver = nativeObserver;
    });

    it('appears once the hero has scrolled past, hides while the closing card is visible, and is keyboard reachable', async () => {
        const callbacks: IntersectionObserverCallback[] = [];
        globalThis.IntersectionObserver = class {
            constructor(cb: IntersectionObserverCallback) {
                callbacks.push(cb);
            }
            observe() {}
            disconnect() {}
        } as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        const { container } = render(<Page />);
        const [watchHero, watchEnd] = callbacks;
        const hero = screen.getByText('hero');
        const end = screen.getByText('closing card');

        expect(screen.queryByRole('link')).toBeNull(); // nothing before scrolling

        act(() => watchHero([entry(hero, false, -10)], {} as IntersectionObserver));
        const cta = screen.getByRole('link', { name: 'Faire estimer mon bien' });
        expect(cta).toHaveAttribute('href', '/estimation-immobiliere-paris');
        expect(cta.className).toContain('bg-primary');
        expect(cta.parentElement).toHaveClass('fixed', 'bottom-0', 'z-60', 'lg:hidden', 'bg-card/95');

        await userEvent.tab();
        expect(cta).toHaveFocus();
        expect(await axe(container)).toHaveNoViolations();

        act(() => watchEnd([entry(end, true, 500)], {} as IntersectionObserver));
        expect(screen.queryByRole('link')).toBeNull(); // the card carries the same button

        act(() => watchEnd([entry(end, false, 900)], {} as IntersectionObserver));
        expect(screen.getByRole('link', { name: 'Faire estimer mon bien' })).toBeInTheDocument();

        act(() => watchHero([entry(hero, false, 300)], {} as IntersectionObserver)); // hero back below the viewport top (scrolled up)
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('renders nothing without IntersectionObserver (server, old browsers)', () => {
        globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
        page.props = sharedProps();
        render(<Page />);

        expect(screen.queryByRole('link')).toBeNull();
    });
});
