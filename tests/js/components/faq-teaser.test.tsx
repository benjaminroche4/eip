import FaqTeaser, { type FaqTeaserData } from '@/components/page/faq-teaser';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, renderPage, sharedProps } from '../inertia';

const FAQ: FaqTeaserData = {
    slug: 'acheter-un-bien',
    items: [
        { question: 'Combien de temps faut-il ?', answer: 'Deux à quatre mois.', slug: 'delai' },
        { question: 'Quels diagnostics ?', answer: 'DPE, amiante, plomb.', slug: 'diagnostics' },
    ],
};

/** The accordion (first question open, expand all, keyboard) is covered by `buy-faq.test.tsx` (same block through its Buy wrapper). */
describe('FaqTeaser', () => {
    it('renders the header texts, the id and the topic link it is given (the « Vendre » page)', () => {
        page.props = sharedProps();
        renderPage(
            <FaqTeaser
                id="sell-faq-title"
                faq={{ ...FAQ, slug: 'vendre-un-bien' }}
                texts={{
                    eyebrow: 'Questions fréquentes',
                    title: 'Vos questions avant de vendre à Paris',
                    intro: 'Estate in Paris répond aux vendeurs à Paris.',
                    all: 'Toutes les questions',
                }}
            />,
        );

        const title = screen.getByRole('heading', { level: 2, name: 'Vos questions avant de vendre à Paris' });
        expect(title).toHaveAttribute('id', 'sell-faq-title');
        expect(screen.getByText('Estate in Paris répond aux vendeurs à Paris.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Toutes les questions' })).toHaveAttribute('href', '/questions-frequentes#vendre-un-bien');
    });
});
