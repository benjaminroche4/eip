import VisitForm from '@/components/properties/visit-form';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { formPost, page, renderPage, sharedProps } from '../inertia';

const LISTING = PROPERTY;

describe('VisitForm', () => {
    it('opens the request in a modal and posts the contact form with the listing and the reference in the message (no slot pills since 2026-09-29)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<VisitForm property={LISTING} reference="AP-6" />);
        expect(screen.queryByRole('group', { name: 'Prochaines visites' })).toBeNull();
        expect(screen.queryByLabelText(/Prénom/)).toBeNull(); // nothing until the visitor acts
        const cta = screen.getByRole('button', { name: 'Demander une visite' });
        expect(cta).toHaveAttribute('aria-haspopup', 'dialog');
        expect(cta).toHaveAttribute('aria-expanded', 'false');

        await user.click(cta);
        const dialog = await screen.findByRole('dialog', { name: 'Demander une visite' });
        expect(dialog).toHaveTextContent(LISTING.title);
        expect(dialog).toHaveClass('bg-background-05', 'rounded-none');
        expect(within(dialog).queryByRole('group', { name: 'Prochaines visites' })).toBeNull();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(cta).toHaveFocus(); // Escape closes, the focus comes back to the button that opened it

        await user.click(cta);
        await screen.findByRole('dialog', { name: 'Demander une visite' });
        await user.type(screen.getByLabelText(/Prénom/), 'Jean');
        await user.type(screen.getByLabelText(/^Nom/), 'Dupont');
        await user.type(screen.getByLabelText(/e-mail/i), 'jean@example.com');
        await user.type(screen.getByLabelText(/Message/), 'Plutôt en fin de journée.');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'Envoyer ma demande de visite' }));

        expect(formPost).toHaveBeenCalledWith('/contact.store', expect.objectContaining({ preserveScroll: true }));
        const message = (document.querySelector('input[name="message"]') as HTMLInputElement).value; // the form lives in the portalled dialog
        expect(message).toContain('Je souhaite visiter « Appartement haussmannien, Saint-Germain-des-Prés » (référence AP-6).');
        expect(message).toContain('Plutôt en fin de journée.');
        expect(await axe(container)).toHaveNoViolations();
    });
});
