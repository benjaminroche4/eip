import BuyFaq, { type BuyFaq as BuyFaqData } from '@/components/buy/buy-faq';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const FAQ: BuyFaqData = {
    slug: 'acheter-un-bien',
    items: [
        { question: 'Un étranger peut-il acheter à Paris ?', answer: 'Oui, sans restriction.', slug: 'etranger' },
        { question: 'Combien de temps faut-il ?', answer: 'Trois à quatre mois.', slug: 'delai' },
        { question: 'Des biens off-market ?', answer: 'Oui. [Confiez-nous votre recherche](contact) pour y accéder.', slug: 'off-market' },
    ],
};

describe('BuyFaq', () => {
    it('renders the header, the accordion with the first question open, the markup links and the link to the FAQ topic', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<BuyFaq faq={FAQ} />);

        expect(screen.getByRole('heading', { level: 2, name: "Vos questions avant d'acheter à Paris" })).toBeInTheDocument();
        const triggers = screen.getAllByRole('button', { name: /\?$/ });
        expect(triggers).toHaveLength(3);
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'true');
        expect(triggers[1]).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('link', { name: 'Voir toutes les questions' })).toHaveAttribute('href', '/questions-frequentes#acheter-un-bien');

        await userEvent.click(screen.getByRole('button', { name: 'Tout ouvrir' }));
        expect(screen.getByRole('link', { name: 'Confiez-nous votre recherche' })).toHaveAttribute('href', '/contact');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('toggles a question with the keyboard', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        renderPage(<BuyFaq faq={FAQ} />);
        const second = screen.getByRole('button', { name: 'Combien de temps faut-il ?' });

        second.focus();
        await user.keyboard('{Enter}');
        expect(second).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Trois à quatre mois.')).toBeVisible();
        await user.keyboard(' ');
        expect(second).toHaveAttribute('aria-expanded', 'false');
    });
});
