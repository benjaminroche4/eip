import DistrictLinks from '@/components/properties/district-links';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const DISTRICTS = [
    { n: 3, slug: 'paris-3e', url: '/nos-biens/paris-3e', name: 'Paris 3e', count: 1 },
    { n: 8, slug: 'paris-8e', url: '/nos-biens/paris-8e', name: 'Paris 8e', count: 2 },
];

describe('DistrictLinks', () => {
    it('lists one editorial row per arrondissement, named with its count, the current page marked and reachable by keyboard', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<DistrictLinks districts={DISTRICTS} current={8} />);
        const nav = screen.getByRole('navigation', { name: 'Nos biens par arrondissement' });
        const links = within(nav).getAllByRole('link');
        expect(links.map((l) => l.getAttribute('aria-label'))).toEqual(['Paris 3e (1)', 'Paris 8e (2)']);
        expect(links[1]).toHaveAttribute('aria-current', 'page');
        expect(links[1]).toHaveClass('bg-background-05'); // current = sand row, never a weight change
        expect(links[0]).not.toHaveClass('bg-background-05');
        expect(links[0]).toHaveAttribute('href', '/nos-biens/paris-3e');
        await user.tab();
        expect(links[0]).toHaveFocus();
        await user.tab();
        expect(links[1]).toHaveFocus();
        expect(await axe(container)).toHaveNoViolations();
    });
});
