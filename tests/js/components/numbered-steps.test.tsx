import NumberedSteps, { type Step } from '@/components/page/numbered-steps';
import { act, screen, within } from '@testing-library/react';
import { Search, Sparkles, UsersRound } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: Step[] = [
    { title: 'Estimation', text: 'Une valeur fondée sur les ventes réelles.' },
    { title: 'Mise en valeur', text: 'Photos, vidéo, plans.' },
    { title: 'Négociation et signature', text: "De l'offre à l'acte." },
];

const TEXTS = { eyebrow: 'Notre méthode', title: 'Comment vendons-nous votre bien ?', intro: 'Estate in Paris vend à Paris en trois étapes.' };
const PHOTOS = [
    { src: '/images/sell/step-1-{w}.jpg', alt: 'Estimation à Paris' },
    { src: '/images/sell/step-2-{w}.jpg', alt: '' },
    { src: '/images/sell/step-3-{w}.jpg', alt: '' },
];

/** The buttons and the cascade are also covered by `buy-strategies.test.tsx` (same block through its Buy wrapper). */
describe('NumberedSteps', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the header, the cross-fading photos, the icons and the id it is given (the « Vendre » steps)', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <NumberedSteps
                id="sell-process-title"
                items={ITEMS}
                texts={{
                    eyebrow: 'Notre méthode',
                    title: 'Comment vendons-nous votre bien ?',
                    intro: 'Estate in Paris vend à Paris en trois étapes.',
                }}
                photos={[
                    { src: '/images/sell/step-1-{w}.jpg', alt: 'Estimation à Paris' },
                    { src: '/images/sell/step-2-{w}.jpg', alt: '' },
                    { src: '/images/sell/step-3-{w}.jpg', alt: '' },
                ]}
                icons={[Search, Sparkles, UsersRound]}
            />,
        );

        const section = screen.getByRole('region', { name: 'Comment vendons-nous votre bien ?' });
        expect(section.querySelector('h2')).toHaveAttribute('id', 'sell-process-title');
        expect(screen.getByText('Notre méthode')).toBeInTheDocument();
        expect(screen.getByText('Estate in Paris vend à Paris en trois étapes.')).toBeInTheDocument();
        const photos = container.querySelectorAll('img');
        expect(photos[0]).toHaveAttribute('src', '/images/sell/step-1-1600.jpg');
        expect(photos[0]).toHaveAttribute('srcset', '/images/sell/step-1-800.jpg 800w, /images/sell/step-1-1600.jpg 1600w');
        expect(photos[0]).toHaveAccessibleName('Estimation à Paris');
        expect(photos[2]).toHaveAttribute('src', '/images/sell/step-3-1600.jpg');
        expect(photos[2]).toHaveAttribute('alt', '');
        expect(screen.getAllByRole('button')).toHaveLength(3);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('locks the step under the middle of the viewport, measured on scroll (a short step is never skipped)', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <NumberedSteps id="sell-process-title" items={ITEMS} texts={TEXTS} photos={PHOTOS} icons={[Search, Sparkles, UsersRound]} />,
        );
        const list = container.querySelector('ol')!;
        const rows = Array.from(container.querySelectorAll('ol > li'));
        expect(container.querySelector('.animate-value-lock')).toBeNull(); // nothing active before the list reaches the middle

        // Viewport 1000px high (middle line at 500): the list is still below the middle at first.
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000);
        const rects = new Map<Element, [number, number]>([
            [list, [700, 1500]],
            [rows[0], [700, 900]],
            [rows[1], [950, 1010]], // a short step sitting in a gap
            [rows[2], [1060, 1300]],
        ]);
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            const [top, bottom] = rects.get(this) ?? [0, 0];
            return { top, bottom, height: bottom - top, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
        });
        const scroll = async (by: number) => {
            rects.forEach(([top, bottom], el) => rects.set(el, [top - by, bottom - by]));
            window.dispatchEvent(new Event('scroll'));
            await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
        };

        await scroll(0);
        expect(container.querySelector('.animate-value-lock')).toBeNull(); // the list has not reached the middle yet
        await scroll(300); // 01 spans 400-600: under the middle line
        expect(rows[0].querySelector('button > span')).toHaveClass('animate-value-lock', 'text-foreground');
        expect(within(rows[0] as HTMLElement).getByTestId('strategy-ring')).toHaveAttribute('aria-hidden');
        await scroll(180); // 02 now spans 470-530: the short step is caught
        expect(rows[1].querySelector('button > span')).toHaveClass('animate-value-lock');
        expect(rows[0].querySelector('button > span')).not.toHaveClass('animate-value-lock');
        expect(container.querySelectorAll('img')[1]).toHaveClass('opacity-100'); // the photo follows
        await scroll(60); // middle line in the gap between 02 (ends at 470) and 03 (starts at 520): the nearest, 03, wins
        expect(rows[2].querySelector('button > span')).toHaveClass('animate-value-lock');
    });
});
