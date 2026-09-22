import NewsletterBenefits from '@/components/newsletter/newsletter-benefits';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('NewsletterBenefits', () => {
    it('keeps its h2 for screen readers only, three benefits with a round sand icon disc and a named source', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<NewsletterBenefits />);

        const h2 = screen.getByRole('heading', { level: 2, name: 'Que contient la newsletter ?' });
        expect(h2.className).toMatch(/sr-only/); // no visible title (a visible question h2 was tried and dropped — user decision 2026-09-22)
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
        const tiles = Array.from(container.querySelectorAll('span[aria-hidden]')).filter((el) => el.querySelector('svg'));
        expect(tiles).toHaveLength(3);
        tiles.forEach((tile) => {
            expect(tile.className).toMatch(/bg-background-05/); // sand square, same as the contact page icons
            expect(tile.className).toMatch(/rounded-full/); // round sand disc, as the contact page icons (user decision 2026-09-22)
        });
        expect(screen.getByText(/Notaires du Grand Paris/)).toBeInTheDocument(); // dated, named source instead of a bare claim
        expect(await axe(container)).toHaveNoViolations();
    });
});
