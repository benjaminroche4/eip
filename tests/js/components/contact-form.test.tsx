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

        for (const name of ['Prénom', 'Nom', 'Adresse e-mail', 'Téléphone']) {
            const field = screen.getByLabelText(new RegExp(`^${name}`));
            expect(field).toHaveAttribute('aria-required', 'true');
            expect(field).not.toHaveAttribute('aria-invalid', 'true');
        }
        expect(screen.getByRole('combobox', { name: /Je suis intéressé par/ })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByLabelText(/^Message/)).toHaveAttribute('aria-required', 'false');
        expect(screen.getByRole('combobox', { name: 'Indicatif du pays' })).toHaveTextContent('FR');
        expect(screen.getByRole('checkbox', { name: /j'accepte l'utilisation de mes informations/ })).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('button', { name: 'Envoyer ma demande' })).toBeEnabled();
        expect(screen.getByRole('heading', { level: 2, name: 'Demandez un rappel' })).toBeInTheDocument();
    });

    it('posts to the contact route with the typed values', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        await user.type(screen.getByLabelText(/^Prénom/), 'Jean');
        await user.type(screen.getByLabelText(/^Téléphone/), '612345678');
        await user.type(screen.getByLabelText(/^Message/), 'Je souhaite acheter un appartement dans le Marais.');
        await user.click(screen.getByRole('checkbox', { name: /j'accepte/ }));
        expect(screen.getByRole('checkbox', { name: /j'accepte/ })).toBeChecked();
        await user.click(screen.getByRole('button', { name: 'Envoyer ma demande' }));

        expect(formPost).toHaveBeenCalledWith('/fr/contact.store', expect.objectContaining({ preserveScroll: true }));
        expect(screen.getByText('50/2000')).toBeInTheDocument();
        expect(screen.getByLabelText(/^Téléphone/)).toHaveValue('+33 6 12 34 56 78');
        await user.type(screen.getByLabelText(/^Téléphone/), '9999999'); // beyond the French length: ignored
        expect(screen.getByLabelText(/^Téléphone/)).toHaveValue('+33 6 12 34 56 78');
    });

    it('lets you search a country and switches the calling code', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        await user.click(screen.getByRole('combobox', { name: 'Indicatif du pays' }));
        await user.type(screen.getByPlaceholderText('Rechercher un pays…'), 'suis');
        await user.click(screen.getByRole('option', { name: /^Suisse\+41/ }));

        expect(screen.getByRole('combobox', { name: 'Indicatif du pays' })).toHaveTextContent('CH');
        expect(screen.getByLabelText(/^Téléphone/)).toHaveValue('+41');
        expect(screen.getByLabelText(/^Téléphone/)).toHaveFocus(); // the library moves focus to the number once a country is picked
    });

    it('opens the topic list when its label is clicked, and picks a topic with the keyboard', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        await user.click(screen.getByText('Je suis intéressé par'));
        expect(await screen.findByRole('listbox')).toBeInTheDocument();

        await user.keyboard('{ArrowDown}{Enter}');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /Je suis intéressé par/ })).toHaveTextContent(/Acheter un bien|Vendre un bien/);
    });

    it('is fully reachable with Tab, in reading order, and the honeypot is skipped', async () => {
        const user = userEvent.setup();
        renderPage(<ContactForm topics={TOPICS} />);

        const order = [
            screen.getByLabelText(/^Prénom/),
            screen.getByLabelText(/^Nom/),
            screen.getByLabelText(/^Adresse e-mail/),
            screen.getByRole('combobox', { name: 'Indicatif du pays' }),
            screen.getByLabelText(/^Téléphone/),
            screen.getByRole('combobox', { name: /Je suis intéressé par/ }),
            screen.getByLabelText(/^Message/),
            screen.getByRole('checkbox', { name: /j'accepte/ }),
            screen.getByRole('button', { name: 'Envoyer ma demande' }),
        ];
        for (const el of order) {
            await user.tab();
            expect(el).toHaveFocus();
        }
    });

    it('replaces the form with the confirmation (focused title, advisor card, CTA) once sent', () => {
        page.props = sharedProps({ flash: { success: 'Merci, votre demande a bien été envoyée.', callbackPhone: '+41782157284' } });
        renderPage(<ContactForm topics={TOPICS} />);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Merci, votre demande a bien été envoyée.');
        expect(screen.getByRole('heading', { level: 2, name: 'Votre demande a bien été reçue' })).toHaveFocus();
        expect(screen.getByRole('heading', { level: 3, name: 'Votre conseiller' })).toBeInTheDocument();
        expect(status).toHaveTextContent('Maris Moreau');
        expect(status).toHaveTextContent('30 minutes maximum');
        expect(status).toHaveTextContent("Si vous n'êtes pas disponible, il vous laissera un SMS ou un e-mail.");
        expect(status).toHaveTextContent('Nous vous appelons au :');
        expect(status).toHaveTextContent('+41 78 215 72 84');
        expect(screen.getByRole('link', { name: /Retour à l'accueil/ })).toHaveAttribute('href', '/fr');
        expect(screen.queryByRole('button', { name: 'Envoyer ma demande' })).not.toBeInTheDocument();
    });

    it('hides the advisor card when no advisor is configured', () => {
        const props = sharedProps({ flash: { success: 'Envoyé.', callbackPhone: null } });
        page.props = { ...props, seo: { ...props.seo, advisor: null } };
        renderPage(<ContactForm topics={TOPICS} />);
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = renderPage(<ContactForm topics={TOPICS} />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
