import ValuesList from '@/components/about/values-list';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('ValuesList', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the header, the contact button and five numbered values as an ordered list', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<ValuesList />);

        expect(screen.getByRole('heading', { level: 2, name: "Qu'est-ce qui guide nos missions ?" })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contacter un conseiller' })).toHaveAttribute('href', '/contact');
        expect(screen.queryByText('Votre interlocuteur unique')).toBeNull(); // advisor line removed (user decision 2026-09-22)
        const list = container.querySelector('ol')!;
        const values = within(list).getAllByRole('listitem');
        expect(values).toHaveLength(5);
        expect(within(values[0]).getByRole('heading', { level: 3, name: 'Confidentialité' })).toBeInTheDocument();
        expect(values[0]).toHaveTextContent('01');
        expect(within(values[4]).getByRole('heading', { level: 3, name: 'Ouverture internationale' })).toBeInTheDocument();
        expect(within(list).getAllByRole('button')).toHaveLength(5); // each row activates its value
        expect(list.querySelector('li')?.className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal

        expect(await axe(container)).toHaveNoViolations();
    });

    it('locks the number of the value nearest to the middle of the viewport (nothing active before scrolling)', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<ValuesList />);
        const list = container.querySelector('ol')!;
        const items = Array.from(container.querySelectorAll('ol > li'));

        expect(container.querySelector('.animate-value-lock')).toBeNull();
        expect(screen.queryByTestId('value-ring')).toBeNull();

        // Viewport 1000px high (middle line at 500): values of 100px every 150px; 04 is a short one (60px) sitting in a gap.
        vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000);
        const rects = new Map<Element, [number, number]>([
            [list, [0, 1000]],
            [items[0], [100, 200]],
            [items[1], [250, 350]],
            [items[2], [400, 480]],
            [items[3], [530, 590]],
            [items[4], [640, 740]],
        ]);
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            const [top, bottom] = rects.get(this) ?? [0, 0];
            return { top, bottom, height: bottom - top, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
        });
        const scroll = async () => {
            window.dispatchEvent(new Event('scroll'));
            await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
        };

        // The middle line (500) is in the gap between 03 (ends at 480) and 04 (starts at 530): the nearest, 03, is active.
        await scroll();
        expect(items[2].querySelector('button > span')).toHaveClass('animate-value-lock', 'text-foreground');
        expect(items[0].querySelector('button > span')).not.toHaveClass('animate-value-lock');
        expect(within(items[2] as HTMLElement).getByTestId('value-ring')).toHaveAttribute('aria-hidden');

        // Scroll 60px further: 04 now sits under the middle line, even though it is shorter than the old detection band.
        rects.forEach(([top, bottom], el) => rects.set(el, [top - 60, bottom - 60]));
        await scroll();
        expect(items[3].querySelector('button > span')).toHaveClass('animate-value-lock', 'text-foreground');
        expect(items[2].querySelector('button > span')).not.toHaveClass('animate-value-lock');
    });

    it('activates a value on click and with the keyboard, in addition to the scroll', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        const { container } = renderPage(<ValuesList />);
        const buttons = within(container.querySelector('ol')!).getAllByRole('button');

        await user.click(buttons[3]);
        expect(buttons[3]).toHaveAttribute('aria-current', 'true');
        expect(buttons[3].querySelector('.animate-value-lock')).not.toBeNull();
        expect(buttons[0]).not.toHaveAttribute('aria-current');

        await user.tab({ shift: true });
        expect(buttons[2]).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(buttons[2]).toHaveAttribute('aria-current', 'true');
        expect(buttons[3]).not.toHaveAttribute('aria-current');
    });
});
