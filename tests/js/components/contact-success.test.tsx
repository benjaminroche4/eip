import ContactSuccess from '@/components/contact/contact-success';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('ContactSuccess', () => {
    it('shows the confirmation, the advisor card (Figma 261-6733) and the back-home CTA', async () => {
        const { container } = renderPage(<ContactSuccess message="Merci, votre demande a bien été envoyée." />);

        expect(screen.getByRole('status')).toHaveTextContent('Votre demande a bien été reçue');
        expect(screen.getByText('Merci, votre demande a bien été envoyée.')).toBeInTheDocument();

        const card = screen.getByRole('region', { name: 'Votre conseiller' });
        expect(within(card).getByText('Maris Moreau')).toBeInTheDocument();
        expect(within(card).getByText('Conseillère senior')).toBeInTheDocument();
        expect(within(card).getByRole('img', { name: 'Parle français et anglais' })).toBeInTheDocument();
        expect(within(card).getByText('Il vous contactera dans un délai de :')).toBeInTheDocument();
        expect(within(card).getByText('30 minutes maximum')).toBeInTheDocument();
        expect(within(card).getByText("Durant les heures d'ouverture.")).toBeInTheDocument();
        expect(within(card).getByText("Si vous n'êtes pas disponible, il vous laissera un SMS ou un e-mail.")).toBeInTheDocument();
        expect(within(card).queryByText(/expérience|Rappel sous/)).not.toBeInTheDocument();

        expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
        expect(await axe(container)).toHaveNoViolations();
    });

    it('moves focus to the title so keyboard and screen-reader users land on the confirmation', () => {
        renderPage(<ContactSuccess message="ok" />);
        expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    });
});
