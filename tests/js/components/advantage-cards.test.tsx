import AdvantageCards from '@/components/page/advantage-cards';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Camera, ChartLine, Handshake, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS = [
    { icon: ChartLine, title: 'Estimation fondée sur les ventes réelles', text: 'Transactions récentes du quartier.' },
    { icon: Camera, title: 'Mise en valeur soignée', text: 'Photos, vidéo, home staging.' },
    { icon: Users, title: 'Acquéreurs qualifiés', text: 'Projet, calendrier, financement.' },
    { icon: Handshake, title: "Négociation jusqu'à l'acte", text: "De l'offre à la signature." },
];

describe('AdvantageCards', () => {
    it('renders the question header, four numbered cards and the outline button as the only focusable element', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <AdvantageCards
                id="sell-advantages-title"
                eyebrow="Pourquoi Estate in Paris"
                title="Pourquoi vendre avec Estate in Paris ?"
                intro="Estate in Paris vend à Paris."
                items={ITEMS}
                cta={{ href: '/estimation-immobiliere-paris', label: 'Faire estimer mon bien' }}
            />,
        );

        const section = screen.getByRole('region', { name: 'Pourquoi vendre avec Estate in Paris ?' });
        expect(section).toHaveClass('w-screen'); // sand band breaking out of the column
        expect(screen.getByText('Estate in Paris vend à Paris.')).toBeInTheDocument();
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(within(items[0]).getByRole('heading', { level: 3, name: 'Estimation fondée sur les ventes réelles' })).toBeInTheDocument();
        expect(items[3]).toHaveTextContent('04'); // sand numbering
        expect(items[0].querySelector('svg')).toHaveAttribute('aria-hidden');
        expect(items[0].className).toMatch(/animate-hero-rise|opacity-0/); // cascade on reveal

        const cta = screen.getByRole('link', { name: 'Faire estimer mon bien' });
        expect(cta).toHaveAttribute('href', '/estimation-immobiliere-paris');
        expect(cta.className).toContain('border'); // outline: an intermediate action, never the page's primary one
        await userEvent.tab();
        expect(cta).toHaveFocus();
        expect(container.querySelectorAll('a, button')).toHaveLength(1);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('renders nothing interactive without a cta', () => {
        page.props = sharedProps();
        const { container } = renderPage(<AdvantageCards id="x-title" eyebrow="E" title="T ?" intro="I" items={ITEMS} />);

        expect(container.querySelectorAll('a, button')).toHaveLength(0);
    });
});
