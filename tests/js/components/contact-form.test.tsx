import ContactForm from '@/components/contact/contact-form';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { formPost, page, renderPage, sharedProps } from '../inertia';

const TOPICS = ['buy', 'sell', 'invest', 'valuation', 'off_market', 'other'];

describe('ContactForm', () => {
    beforeEach(() => {
        formPost.mockClear();
        page.props = sharedProps();
    });

    it('renders every field with an accessible label, marked required', () => {
        renderPage(<ContactForm topics={TOPICS} />);

        for (const name of ['Prénom', 'Nom', 'Adresse e-mail', 'Téléphone', 'Message']) {
            const field = screen.getByLabelText(new RegExp(`^${name}`));
            expect(field).toHaveAttribute('aria-required', 'true');
            expect(field).not.toHaveAttribute('aria-invalid', 'true');
        }
        expect(screen.getByRole('combobox', { name: /Je suis intéressé par/ })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('button', { name: 'Envoyer ma demande' })).toBeEnabled();
        expect(screen.getByRole('heading', { level: 2, name: 'Demander une consultation privée' })).toBeInTheDocument();
    });

    it('posts to the contact route with the typed values', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        await user.type(screen.getByLabelText(/^Prénom/), 'Jean');
        await user.type(screen.getByLabelText(/^Message/), 'Je souhaite acheter un appartement dans le Marais.');
        await user.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));

        expect(formPost).toHaveBeenCalledWith('/fr/contact.store', expect.objectContaining({ preserveScroll: true }));
        expect(screen.getByText('50/2000')).toBeInTheDocument();
    });

    it('is fully reachable with Tab, in reading order, and the honeypot is skipped', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        const order = [
            screen.getByLabelText(/^Prénom/),
            screen.getByLabelText(/^Nom/),
            screen.getByLabelText(/^Adresse e-mail/),
            screen.getByLabelText(/^Téléphone/),
            screen.getByRole('combobox', { name: /Je suis intéressé par/ }),
            screen.getByLabelText(/^Message/),
            screen.getByRole('button', { name: 'Envoyer ma demande' }),
        ];
        for (const el of order) {
            await user.tab();
            expect(el).toHaveFocus();
        }
    });

    it('replaces the form with the confirmation (focused title, advisor card, CTA) once sent', () => {
        page.props = sharedProps({ flash: { success: 'Merci, votre demande a bien été envoyée.' } });
        renderPage(<ContactForm topics={TOPICS} />);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Merci, votre demande a bien été envoyée.');
        expect(screen.getByRole('heading', { level: 2, name: 'Votre demande a bien été reçue' })).toHaveFocus();
        expect(screen.getByRole('heading', { level: 3, name: 'Votre conseiller' })).toBeInTheDocument();
        expect(status).toHaveTextContent('Maris Moreau');
        expect(status).toHaveTextContent("12 ans d'expérience");
        expect(screen.getByRole('link', { name: /Découvrir nos biens/ })).toHaveAttribute('href', '/fr/acheter-immobilier-paris');
        expect(screen.queryByRole('button', { name: 'Envoyer ma demande' })).not.toBeInTheDocument();
    });

    it('hides the advisor card when no advisor is configured', () => {
        const props = sharedProps({ flash: { success: 'Envoyé.' } });
        page.props = { ...props, seo: { ...props.seo, advisor: null } };
        renderPage(<ContactForm topics={TOPICS} />);
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = renderPage(<ContactForm topics={TOPICS} />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
