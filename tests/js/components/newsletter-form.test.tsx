import NewsletterForm from '@/components/newsletter/newsletter-form';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { formPost, page, renderPage, sharedProps } from '../inertia';

const NEXT = { iso: '2026-08-31', label: 'lundi 31 août' };

describe('NewsletterForm', () => {
    beforeEach(() => {
        formPost.mockClear();
        page.props = sharedProps();
    });

    it('renders a required, labelled e-mail field and the next issue date', () => {
        renderPage(<NewsletterForm nextIssue={NEXT} />);

        const email = screen.getByLabelText(/^Adresse e-mail/);
        expect(email).toHaveAttribute('type', 'email');
        expect(email).toHaveAttribute('aria-required', 'true');
        expect(screen.getByRole('button', { name: "S'inscrire" })).toBeEnabled();
        expect(screen.getByText('lundi 31 août')).toHaveAttribute('datetime', '2026-08-31');
        expect(screen.getByText('Pas de spam. Désinscription à tout moment.')).toBeInTheDocument();
    });

    it('is usable from the keyboard and posts to the newsletter route', async () => {
        const user = userEvent.setup();
        renderPage(<NewsletterForm nextIssue={NEXT} />);

        await user.tab();
        expect(screen.getByLabelText(/^Adresse e-mail/)).toHaveFocus();
        await user.keyboard('jean@example.com{Enter}');

        expect(formPost).toHaveBeenCalledWith('/fr/newsletter.store', expect.objectContaining({ preserveScroll: true }));
    });

    it('replaces the form with the confirmation and moves focus to it', () => {
        page.props = sharedProps({ flash: { success: null, callbackPhone: null, newsletter: 'Votre inscription est confirmée.' } });
        renderPage(<NewsletterForm nextIssue={NEXT} />);

        expect(screen.queryByRole('button', { name: "S'inscrire" })).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Votre inscription est confirmée.');
        expect(screen.getByRole('heading', { level: 3, name: 'Bienvenue parmi nos abonnés' })).toHaveFocus();
        expect(screen.getByRole('status')).toHaveTextContent('Première édition le lundi 31 août.');
        expect(screen.getByRole('link', { name: 'Lire nos analyses' })).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = renderPage(<NewsletterForm nextIssue={NEXT} />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
