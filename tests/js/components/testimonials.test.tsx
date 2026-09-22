import Testimonials, { type Testimonial } from '@/components/home/testimonials';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const items: Testimonial[] = [
    { name: 'Sophie M.', context: "Achat d'un loft, Paris 17e", quote: 'Un accompagnement exemplaire.', photo: '/images/testimonials/client-1.jpg' },
    { name: 'Thomas L.', context: 'Vente, Paris 16e', quote: 'Une offre solide, vite.', photo: '/images/testimonials/client-2.jpg' },
    { name: 'Claire R.', context: 'Vente, Paris 7e', quote: 'Sans accroc du début à la fin.', photo: '/images/testimonials/client-3.jpg' },
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
        // Infinite loop: three copies of the row, only the middle one exposed to assistive tech
        expect(container.querySelectorAll('blockquote')).toHaveLength(9);
        expect(container.querySelectorAll('ul.snap-x > li:not([aria-hidden])')).toHaveLength(3);
        expect(screen.getAllByText('Sophie M.')).toHaveLength(3);
        expect(within(container.querySelector('figure')!).getByText('Sophie M.')).toBeInTheDocument();
        expect(container.querySelector('figure')).toHaveClass('border-secondary-30', 'bg-card', 'p-2'); // site card surface
        expect(container.querySelector('ul.snap-x')).toHaveClass('cursor-grab'); // draggable with the mouse
        expect(container.querySelector('figure')?.className).not.toMatch(/shadow/);
        expect(container.querySelector('figcaption span[data-slot="avatar"], figcaption > span')).toHaveClass('rounded-full'); // round portraits

        expect(await axe(container)).toHaveNoViolations();
    });

    it('hides the rating column without real Google figures', () => {
        page.props = sharedProps({ seo: { ...sharedProps().seo, reviews: null } });
        renderPage(<Testimonials items={items} />);

        expect(screen.queryByText(/\+400 avis/)).toBeNull();
        expect(screen.queryByRole('button', { name: /Témoignage/ })).toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(3); // the cards only (loop copies are aria-hidden)
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
