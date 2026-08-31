import ErrorPage from '@/pages/error';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('ErrorPage', () => {
    beforeEach(() => {
        page.props = sharedProps();
    });

    it('renders the 404 with its giant dashed code, the message and the back link', async () => {
        const { container } = renderPage(<ErrorPage status={404} />);

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page introuvable');
        expect(screen.getByText('Erreur 404')).toBeInTheDocument();
        expect(screen.getByText("La page que vous cherchez n'existe pas ou a été déplacée.")).toBeInTheDocument();

        const code = container.querySelector('svg[viewBox="0 0 640 240"]');
        expect(code).toHaveAttribute('aria-hidden', 'true'); // decorative: never announced
        expect(code).toHaveTextContent('404');

        const back = screen.getByRole('link', { name: "Retour à l'accueil" });
        expect(back).toHaveAttribute('href', '/');
        expect(await axe(container)).toHaveNoViolations();
    });

    it.each([
        [403, 'Accès refusé'],
        [500, 'Erreur serveur'],
        [503, 'Maintenance'],
    ])('renders the %s variant', (status, title) => {
        renderPage(<ErrorPage status={status} />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
        expect(screen.getByText(`Erreur ${status}`)).toBeInTheDocument();
    });

    it('falls back to the 500 texts for an unknown status', () => {
        renderPage(<ErrorPage status={418} />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Erreur serveur');
        expect(screen.getByText('Erreur 500')).toBeInTheDocument();
    });
});
