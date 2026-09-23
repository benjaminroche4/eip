import TeamGrid, { type TeamMember } from '@/components/about/team-grid';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const members: TeamMember[] = [
    {
        name: 'Alexandre Moreau',
        role: 'Conseiller senior',
        languages: 'Parle français et anglais',
        flags: ['FR', 'GB'],
        photo: '/images/team/member-1.jpg',
    },
    {
        name: 'Sophie Dubois',
        role: 'Spécialiste acquéreurs internationaux',
        languages: 'Parle français et anglais',
        flags: ['FR', 'GB'],
        photo: '/images/team/member-2.jpg',
    },
    {
        name: 'Emma Lefèvre',
        role: 'Conseillère investissement',
        languages: 'Parle français et anglais',
        flags: ['FR', 'GB'],
        photo: '/images/team/member-3.jpg',
    },
];

describe('TeamGrid', () => {
    it('renders the header, one card per member and the mobile arrows', async () => {
        const { container } = renderPage(<TeamGrid members={members} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Qui sont nos conseillers ?' })).toBeInTheDocument();
        expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Alexandre Moreau', 'Sophie Dubois', 'Emma Lefèvre']);
        expect(container.querySelector('img[src="/images/team/member-1.jpg"]')).toHaveAttribute('alt', ''); // the name is right below
        const card = container.querySelector('ul.snap-x > li > div')!;
        expect(card).toHaveClass('border-secondary-30', 'bg-card', 'p-2'); // the site's card
        expect(screen.getByText('Conseiller senior')).toBeInTheDocument();
        // Languages as flags in the sand chip (decorative), the readable label in sr-only
        const chip = screen.getAllByText('Parle français et anglais')[0].parentElement!;
        expect(chip).toHaveClass('bg-background-08');
        expect(chip.querySelectorAll('[aria-hidden="true"] svg')).toHaveLength(2);
        expect(screen.queryByText('FR & EN')).toBeNull();
        expect(card.className).not.toMatch(/rounded|shadow/); // square, no shadow
        expect(screen.getByRole('button', { name: 'Membre précédent' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Membre suivant' })).toBeEnabled();
        expect(screen.queryByRole('link')).toBeNull(); // no « view full team » button

        expect(await axe(container)).toHaveNoViolations();
    });

    it('keeps both arrows off without members and recomputes the current card on resize (2026-09-22)', async () => {
        const { unmount } = renderPage(<TeamGrid members={[]} />);
        expect(screen.getByRole('button', { name: 'Membre précédent' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Membre suivant' })).toBeDisabled();
        unmount();

        const { container } = renderPage(<TeamGrid members={members} />);
        const row = container.querySelector('ul.snap-x') as HTMLElement;
        const cards = Array.from(row.children) as HTMLElement[];
        Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true });
        cards.forEach((card, i) => {
            Object.defineProperty(card, 'offsetLeft', { value: i * 308, configurable: true });
            Object.defineProperty(card, 'offsetWidth', { value: 288, configurable: true });
        });
        row.scrollLeft = 560; // the last card centred
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Membre suivant' })).toBeDisabled());
        expect(screen.getByRole('button', { name: 'Membre précédent' })).toBeEnabled();

        row.scrollLeft = 0; // back at the start after a layout change: « previous » is off again
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Membre précédent' })).toBeDisabled());
    });
});
