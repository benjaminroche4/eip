import BlogFaq from '@/components/blog/blog-faq';
import { type FaqSection } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const section: FaqSection = {
    _key: 'f1',
    _type: 'faqBlock',
    items: [
        { _key: 'i1', question: 'Quels sont les frais de notaire ?', answer: 'Environ 7 à 8 % dans l’ancien.' },
        { _key: 'i2', question: 'Combien de temps dure un achat ?', answer: 'Trois mois en moyenne.' },
    ],
};

describe('BlogFaq', () => {
    it('renders the FAQ-page accordion: h2 fallback title, first question open, expand all, keyboard toggling', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<BlogFaq section={section} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Questions fréquentes');
        const triggers = screen.getAllByRole('button', { name: /\?$/ });
        expect(triggers).toHaveLength(2);
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2); // Radix wraps each question in an h3
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'true'); // first question open by default
        expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');

        await user.click(screen.getByRole('button', { name: 'Tout ouvrir' }));
        expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Trois mois en moyenne.')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Tout replier' }));
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');

        triggers[0].focus();
        await user.keyboard('{Enter}');
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
        await user.keyboard('{ArrowDown}');
        expect(triggers[1]).toHaveFocus();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('renders nothing without items', () => {
        const { container } = renderPage(<BlogFaq section={{ ...section, items: [] }} />);
        expect(container).toBeEmptyDOMElement();
    });
});
