import Hero from '@/components/home/hero';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('Hero', () => {
    beforeEach(() => window.sessionStorage.clear()); // the search draft would leak from one test to the next

    it('renders the clip and the three commitments only — no heading, sentence or button since 2026-09-25', async () => {
        const { container } = renderPage(<Hero />);

        expect(screen.queryByRole('heading')).toBeNull(); // the h1 now lives in the trust intro
        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.queryByText(/25 ans d'expertise/)).toBeNull();
        // Search bar (Figma 712-25068 / 712-25576), no logic: labelled cells, a submit that goes nowhere
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        const title = within(search).getByText("L'agence parisienne des clients internationaux");
        expect(title).toHaveClass('font-semibold', 'tracking-wide', 'text-3xl/11', 'lg:text-5xl/16'); // looser line height (user decision 2026-09-25) // h1 scale, mixed case, light tracking (user decisions 2026-09-25)
        expect(title).not.toHaveClass('uppercase');
        expect(within(search).getByRole('combobox', { name: 'Ville / code postal' })).toHaveAttribute('aria-expanded', 'false'); // typed directly in the cell
        expect(within(search).getByRole('textbox', { name: 'Budget maximum' })).toHaveAttribute('name', 'budget'); // two criteria only (user decision 2026-09-25)
        expect(within(search).queryByRole('combobox', { name: 'Pièces' })).toBeNull();
        expect(within(search).queryByRole('textbox', { name: 'Surface' })).toBeNull();
        expect(within(search).getByRole('button', { name: 'Lancer ma recherche' })).toHaveAttribute('type', 'submit');
        expect(search.parentElement).toHaveClass('pt-28', 'sm:flex-1', 'sm:items-center'); // top of the screen on mobile, centred in the screen from sm
        expect(search).toHaveClass('mx-auto', 'max-w-3xl'); // centred block
        expect(within(search).queryByText(/biens disponibles/)).toBeNull(); // no listings figure → no line
        const values = within(screen.getByRole('list', { name: 'Nos engagements' })).getAllByRole('listitem');
        expect(values.map((li) => li.textContent)).toEqual([
            'Confidentiel et off-market',
            'Les meilleures adresses de Paris',
            'Un accompagnement de A à Z',
        ]);
        values.forEach((li) => expect(li.querySelector('svg')).not.toBeNull());
        expect(screen.getByRole('list', { name: 'Nos engagements' })).toHaveClass('overflow-x-auto', 'snap-x', 'snap-mandatory', 'cursor-grab'); // one line: snap carousel, draggable with the mouse on mobile
        expect(values[0]).toHaveClass('snap-center');
        expect(values[1].querySelector('span[aria-hidden]')).toHaveClass('via-white/60', 'bg-linear-to-b'); // gradient hairline separators, at every width
        expect(container.querySelector('video')).toHaveAttribute('poster', '/images/home/hero-1200.jpg'); // the photo only as the video's poster
        expect(container.querySelector('img')).toBeNull(); // no separate photo fading into the video
        // Reveal on load: the photo settles from a zoom, the row rises first in the cascade
        expect(container.querySelector('video')).toHaveClass('animate-hero-photo');
        expect(screen.getByRole('list', { name: 'Nos engagements' })).toHaveClass('animate-hero-rise');
        expect(screen.getByRole('list', { name: 'Nos engagements' }).style.getPropertyValue('--stagger')).toBe('420ms'); // after the search bar (300 ms)
        expect(container.querySelector('section')).toHaveClass('min-h-svh', 'justify-between', 'sm:justify-end'); // fills the first screen, the row along the bottom edge

        expect(await axe(container, { preload: false })).toHaveNoViolations(); // preload: axe waits for the background video's metadata, which jsdom never loads
    });

    it('types the arrondissement in the cell: filtering, arrows, Enter, Backspace, pills and the « Tout Paris » default (2026-09-25)', async () => {
        const user = userEvent.setup();
        renderPage(<Hero />);
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        const city = within(search).getByRole('combobox', { name: 'Ville / code postal' });
        expect(within(search).getByText('Tout Paris')).toHaveClass('rounded-none'); // default pill: the whole city, square

        await user.click(city); // the list opens under the cell, « Tout Paris » checked
        expect(city).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('option', { name: 'Tout Paris' })).toHaveAttribute('aria-selected', 'true');
        await user.type(city, '75016'); // typing filters: postal code…
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Paris 16e75016']);
        await user.keyboard('{Enter}'); // …Enter adds the highlighted one and clears the text
        expect(city).toHaveValue('');
        expect(within(search).queryByText('Tout Paris')).toBeNull(); // the first arrondissement unchecks « Tout Paris »
        expect(search.querySelectorAll('input[name="city[]"]')).toHaveLength(1);
        await user.type(city, '1'); // « 1 » matches the 1er and the 10e to 19e (a postal code only counts from three digits)
        expect(screen.getAllByRole('option')).toHaveLength(11);
        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}'); // arrows move the highlight: the 10e
        expect([...search.querySelectorAll('input[name="city[]"]')].map((i) => (i as HTMLInputElement).value)).toEqual(['16', '10']);
        expect(within(search).getAllByText('Paris 10e').at(-1)).toHaveClass('rounded-none'); // pills in the order picked (the measuring twin comes first)
        expect(screen.getByRole('status')).toHaveTextContent('2 arrondissements sélectionnés'); // live count in the footer
        await user.keyboard('{Backspace}'); // Backspace on an empty text removes the last pill
        expect(search.querySelectorAll('input[name="city[]"]')).toHaveLength(1);
        await user.click(screen.getByRole('option', { name: /Paris 16e/ })); // a click on a checked row unchecks it
        expect(search.querySelectorAll('input[name="city[]"]')).toHaveLength(0);
        expect(within(search).getByText('Tout Paris')).toBeInTheDocument(); // back to the whole city
        await user.click(screen.getByRole('button', { name: 'Terminé' }));
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('formats the budget, offers quick amounts and clears a cell', async () => {
        const user = userEvent.setup();
        renderPage(<Hero />);
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        const budget = within(search).getByRole('textbox', { name: 'Budget maximum' });
        await user.click(budget); // the focus offers quick amounts under the cell
        await user.click(screen.getByRole('button', { name: '2 000 000 €' }));
        expect(budget).toHaveValue('2 000 000');
        expect(budget).toHaveFocus();
        await user.clear(budget);
        await user.type(budget, '1500000abc');
        expect(budget).toHaveValue('1 500 000'); // digits only, thousands grouped as typed
        expect(within(search).getByText('Budget maximum')).toBeVisible(); // the label stays above the value
        await user.click(within(search).getByRole('button', { name: 'Effacer Budget maximum' }));
        expect(budget).toHaveValue('');

        await user.type(within(search).getByRole('combobox', { name: 'Ville / code postal' }), '7{Enter}');
        expect(search.querySelector('input[name="city[]"]')).toHaveValue('7');
        await user.click(within(search).getByRole('button', { name: 'Effacer Ville / code postal' })); // the cell's × clears every pill
        expect(search.querySelectorAll('input[name="city[]"]')).toHaveLength(0);
    });

    it('shows the properties on offer when the figure is known, and remembers the criteria for the session', async () => {
        const user = userEvent.setup();
        const first = renderPage(<Hero listings={120} />);
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        expect(within(search).getByText('120 biens disponibles à Paris')).toBeInTheDocument();
        await user.type(within(search).getByRole('textbox', { name: 'Budget maximum' }), '900000');
        await user.type(within(search).getByRole('combobox', { name: 'Ville / code postal' }), '16{Enter}');
        expect(JSON.parse(window.sessionStorage.getItem('home-search')!)).toEqual({ cities: [16], budget: '900 000' });
        first.unmount();

        renderPage(<Hero />); // a later visit in the same session: the criteria are back
        const again = screen.getByRole('search', { name: 'Rechercher un bien' });
        expect(within(again).getByRole('textbox', { name: 'Budget maximum' })).toHaveValue('900 000');
        expect(again.querySelector('input[name="city[]"]')).toHaveValue('16');
    });

    it('keeps the pills on one line: when they would overflow, only the last picked one and a « +N » badge remain (2026-09-25)', async () => {
        const user = userEvent.setup();
        // jsdom has no layout: fake a 200px row and an ever-wider twin
        const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
        const scrollWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
        renderPage(<Hero />);
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        const city = within(search).getByRole('combobox', { name: 'Ville / code postal' });
        await user.type(city, '6{Enter}16{Enter}8{Enter}');
        const row = within(search).getAllByText('Paris 8e').at(-1)!.parentElement!; // the visible row (the invisible twin comes first)
        expect(within(row).queryByText('Paris 6e')).toBeNull();
        expect(within(row).getByText('Paris 8e')).toBeInTheDocument(); // the last picked stays…
        const more = within(row).getByRole('button', { name: '2 autre(s) arrondissement(s) : Paris 6e, Paris 16e' });
        expect(more).toHaveTextContent('+2'); // …with the count of the others
        await user.click(more); // the badge reopens the list
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        clientWidth.mockRestore();
        scrollWidth.mockRestore();
    });

    it('opens the lists in bottom sheets below sm, with their own input', async () => {
        const user = userEvent.setup();
        const mql = vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: query === '(max-width: 639px)',
                    media: query,
                    onchange: null,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                }) as MediaQueryList,
        );
        renderPage(<Hero />);
        const search = screen.getByRole('search', { name: 'Rechercher un bien' });
        const city = within(search).getByRole('combobox', { name: 'Ville / code postal' });
        expect(city).toHaveAttribute('readonly'); // the cell only opens the sheet
        await user.click(city);
        const sheet = screen.getByRole('dialog', { name: 'Ville / code postal' });
        await user.type(within(sheet).getByRole('combobox'), '75007');
        await user.click(within(sheet).getByRole('option', { name: /Paris 7e/ }));
        expect(search.querySelector('input[name="city[]"]')).toHaveValue('7');
        await user.click(within(sheet).getByRole('button', { name: 'Terminé' }));
        expect(screen.queryByRole('dialog')).toBeNull();
        await user.click(within(search).getByRole('textbox', { name: 'Budget maximum' }));
        const budgetSheet = screen.getByRole('dialog', { name: 'Budget maximum' });
        await user.click(within(budgetSheet).getByRole('button', { name: '3 000 000 €' }));
        expect(within(search).getByRole('textbox', { name: 'Budget maximum' })).toHaveValue('3 000 000');
        mql.mockRestore();
    });
});
