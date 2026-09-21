import TeamGrid, { type TeamMember } from '@/components/about/team-grid';
import { screen } from '@testing-library/react';
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

        expect(screen.getByRole('heading', { level: 2, name: 'Les experts derrière Estate in Paris' })).toBeInTheDocument();
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
});
