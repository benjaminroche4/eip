import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const items: Testimonial[] = [
    { name: 'Sophie M.', context: "Achat d'un loft, Paris 17e", quote: 'Un accompagnement exemplaire.', photo: '/images/testimonials/client-1.webp' },
    { name: 'Thomas L.', context: 'Vente, Paris 16e', quote: 'Une offre solide, vite.', photo: '/images/testimonials/client-2.webp' },
    { name: 'Claire R.', context: 'Vente, Paris 7e', quote: 'Sans accroc du début à la fin.', photo: '/images/testimonials/client-3.webp' },
    { name: 'Julien B.', context: "Achat d'un appartement familial, Paris 6e", quote: 'Vu avant tout le monde.', source: 'trustpilot' },
];

describe('Testimonials', () => {
    it('renders the header, the Google rating column and the quote cards', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<Testimonials items={items} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Que disent nos clients ?' })).toBeInTheDocument();
        expect(screen.getByText('4,9')).toBeInTheDocument();
        expect(screen.getByText('4,9').closest('div')!.querySelectorAll('svg.lucide-star')).toHaveLength(0); // no stars under the rating (they stay on the cards)
        expect(screen.getByText('4,9').className).toMatch(/\btext-5xl\b.*\bsm:text-7xl\b/); // giant on desktop, tamer on mobile
        expect(screen.getByText('4,9').className).toMatch(/\btext-5xl\b.*\bsm:text-7xl\b/); // giant on desktop, tamer on mobile
        const reviewsLink = screen.getByText(/\+400 avis/).closest('a')!;
        expect(reviewsLink).toHaveAttribute('href', 'https://www.google.com/maps');
        expect(reviewsLink).toHaveTextContent('Sur +400 avis Google'); // the logo sits right before the visible word « Google »
        expect(reviewsLink.querySelector('img')!.nextElementSibling).toHaveTextContent('Google');
        expect(container.querySelector('img[src="/images/social/google.svg"]')).not.toBeNull();
        expect(screen.getByText('+397')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Témoignage précédent' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Témoignage suivant' })).toBeInTheDocument();
        expect(container.querySelector('img[src="/brand/logo-mark.svg"]')).toBeNull(); // no logo
        // Radix renders the avatar <img> only once it has loaded (never under jsdom): count the three avatar discs of the rating column instead
        const stack = container.querySelector('ul[role="list"]')!; // the rating column's stack comes first in the DOM
        expect(stack.querySelectorAll('li > span.rounded-full')).toHaveLength(4); // three avatar discs (photo, initials fallback) + « +N »
        expect(container.querySelectorAll('figure img:not([src^="/images/social/"])')).toHaveLength(0); // never a photo on the quote cards, initials only
        // Source of the review top right of each card (2026-09-23): the Google or Trustpilot logo next to the quotation mark, labelled for assistive tech
        const [first, , , trustpilot] = Array.from(container.querySelectorAll('figure'));
        expect(first.querySelector('img[src="/images/social/google.svg"]')).toHaveAttribute('alt', ''); // no `source` = Google
        expect(within(first).getByText('Avis Google')).toHaveClass('sr-only');
        expect(first.querySelector('img[src="/images/social/google.svg"]')!.closest('div')).toHaveClass('justify-between'); // same row as the quotation mark, pushed right
        expect(trustpilot.querySelector('img')).toHaveAttribute('src', '/images/social/trustpilot-wordmark.svg'); // full name for Trustpilot
        expect(trustpilot.querySelector('img')).toHaveClass('h-4'); // both logos 16px high
        expect(first.querySelector('img[src="/images/social/google.svg"]')).toHaveClass('size-4');
        expect(within(trustpilot).getByText('Avis Trustpilot')).toHaveClass('sr-only');
        expect(screen.getAllByText('SM').length).toBeGreaterThan(0); // « Sophie M. » → SM, upper case
        // Infinite loop: three copies of the row, only the middle one exposed to assistive tech
        expect(container.querySelectorAll('blockquote')).toHaveLength(12);
        expect(container.querySelectorAll('ul.snap-x > li:not([aria-hidden])')).toHaveLength(4);
        expect(screen.getAllByText('Sophie M.')).toHaveLength(3);
        expect(within(container.querySelector('figure')!).getByText('Sophie M.')).toBeInTheDocument();
        expect(container.querySelector('figure')).toHaveClass('border-secondary-30', 'bg-card', 'p-2'); // site card surface
        expect(container.querySelector('ul.snap-x')).toHaveClass('cursor-grab', 'data-[dragging=true]:select-none'); // draggable with the mouse; quotes selectable otherwise (2026-09-22)
        expect(container.querySelector('ul.snap-x')!.className).not.toMatch(/(^|\s)select-none(\s|$)/);
        expect(container.querySelector('figure')?.className).not.toMatch(/shadow/);
        expect(container.querySelector('figcaption span[data-slot="avatar"], figcaption > span')).toHaveClass('rounded-full'); // round portraits

        expect(await axe(container)).toHaveNoViolations();
    });

    it('hides the rating column without real Google figures but keeps the arrows under the row (2026-09-22)', async () => {
        page.props = sharedProps({ seo: { ...sharedProps().seo, reviews: null } });
        const scrollBy = vi.fn();
        window.HTMLElement.prototype.scrollBy = scrollBy;
        const { container } = renderPage(<Testimonials items={items} />);

        expect(screen.queryByText(/\+400 avis/)).toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(4); // the cards only (loop copies are aria-hidden)
        // The row stays keyboard-operable: one pair of arrows, under the row
        expect(screen.getAllByRole('button', { name: 'Témoignage précédent' })).toHaveLength(1);
        const next = screen.getByRole('button', { name: 'Témoignage suivant' });
        expect(next.compareDocumentPosition(container.querySelector('ul.snap-x')!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
        next.focus();
        await userEvent.keyboard('{Enter}');
        expect(scrollBy).toHaveBeenCalledTimes(1);
        expect(await axe(container)).toHaveNoViolations();
    });

    it('moves the row by the distance between two cards, not by a fixed gap (2026-09-22)', async () => {
        page.props = sharedProps();
        const scrollBy = vi.fn();
        window.HTMLElement.prototype.scrollBy = scrollBy;
        const { container } = renderPage(<Testimonials items={items} />);
        const cards = Array.from(container.querySelector('ul.snap-x')!.children) as HTMLElement[];
        Object.defineProperty(cards[0], 'offsetLeft', { value: 0, configurable: true });
        Object.defineProperty(cards[0], 'offsetWidth', { value: 320, configurable: true });
        Object.defineProperty(cards[1], 'offsetLeft', { value: 336, configurable: true }); // 320 + gap-4

        await userEvent.click(screen.getByRole('button', { name: 'Témoignage suivant' }));
        expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: 336 }));
        await userEvent.click(screen.getByRole('button', { name: 'Témoignage précédent' }));
        expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -336 }));
    });
});

describe('Testimonials autoplay', () => {
    it('advances one card every 5 s and rests while the cards are hovered', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const scrollBy = vi.fn();
        window.HTMLElement.prototype.scrollBy = scrollBy;
        page.props = sharedProps();
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const { container } = renderPage(<Testimonials items={items} />);

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });
        expect(scrollBy).toHaveBeenCalledTimes(1);
        expect(scrollBy.mock.calls[0][0]).toMatchObject({ left: expect.any(Number) });

        // Hover: the row rests
        const row = container.querySelector('ul.snap-x')!.parentElement!;
        await user.hover(row);
        await act(async () => {
            vi.advanceTimersByTime(10000);
        });
        expect(scrollBy).toHaveBeenCalledTimes(1);
        await user.unhover(row);
        await act(async () => {
            vi.advanceTimersByTime(5000);
        });
        expect(scrollBy).toHaveBeenCalledTimes(2);

        expect(await axe(container)).toHaveNoViolations();
        vi.useRealTimers();
    });

    it('never auto-scrolls under prefers-reduced-motion', async () => {
        vi.useFakeTimers();
        const scrollBy = vi.fn();
        window.HTMLElement.prototype.scrollBy = scrollBy;
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: query.includes('reduce'),
                    media: query,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                }) as unknown as MediaQueryList,
        );
        page.props = sharedProps();
        renderPage(<Testimonials items={items} />);

        await act(async () => {
            vi.advanceTimersByTime(20000);
        });
        expect(scrollBy).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});
