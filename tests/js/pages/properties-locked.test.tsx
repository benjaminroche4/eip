import PropertyLockedPage from '@/pages/properties/locked';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { formPost, page, renderPage, sharedProps } from '../inertia';

/** The off-market gate page « Ticket » (ui.sh variant chosen on 2026-10-14): a listing's gate and the selection's gate. */
describe('Property locked page', () => {
    beforeEach(() => {
        document.elementFromPoint ??= () => null;
        formPost.mockClear();
        page.props = sharedProps();
    });

    it('names only the kind of the listing, carries the gate wired to that listing, and passes axe', async () => {
        const { container } = renderPage(
            <PropertyLockedPage teaser={{ type: 'apartment', transaction: 'sale', arrondissement: 7, slug: 'secret-paris-7e' }} />,
        );
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ce bien est confidentiel');
        expect(screen.getByText('Appartement · Achat · Paris 7e')).toBeInTheDocument();
        expect(container.textContent).not.toContain('secret-paris-7e'); // the slug only travels with the form, never shown
        expect(screen.getByLabelText("Code d'accès")).toBeInTheDocument();
        expect(screen.getByRole('link', { name: "Demander un code d'accès" })).toHaveAttribute('href', '/contact');
        expect(await axe(container)).toHaveNoViolations();
    });

    it('the selection gate has its own title and no teaser', () => {
        renderPage(<PropertyLockedPage teaser={null} />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cette sélection est confidentielle');
        expect(screen.queryByText(/·/)).toBeNull();
    });
});
