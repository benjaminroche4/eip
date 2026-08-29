import FaqPage from '@/pages/faq';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const CATEGORIES = [
    {
        key: 'buying',
        slug: 'acheter-un-bien',
        title: 'Acheter un bien',
        items: [
            {
                slug: 'un-etranger-peut-il-acheter',
                question: 'Un étranger peut-il acheter ?',
                answer: 'Oui, sans restriction. [Contactez-nous](contact).',
            },
            { slug: 'combien-de-temps-pour-acheter', question: 'Combien de temps pour acheter ?', answer: 'Trois à quatre mois.' },
        ],
    },
    {
        key: 'selling',
        slug: 'vendre-un-bien',
        title: 'Vendre un bien',
        items: [{ slug: 'combien-de-temps-pour-vendre', question: 'Combien de temps pour vendre ?', answer: 'Entre deux et quatre mois.' }],
    },
];
const render = () => renderPage(<FaqPage categories={CATEGORIES} />);
const panel = () => screen.getByRole('tabpanel');
const openQuestions = () =>
    within(panel())
        .queryAllByRole('button', { expanded: true })
        .filter((b) => b.getAttribute('data-slot') === 'accordion-trigger');

describe('FAQ page', () => {
    beforeEach(() => {
        page.props = sharedProps();
        window.location.hash = '';
    });

    it('renders the topics as tabs, the first question open and links in answers', () => {
        render();

        expect(screen.getByRole('heading', { level: 1, name: 'Questions fréquentes' })).toBeInTheDocument();
        const tabs = within(screen.getByRole('tablist', { name: 'Thèmes de la FAQ' })).getAllByRole('tab');
        expect(tabs[0]).toHaveAccessibleName('Acheter un bien'); // the question count is decorative (aria-hidden)
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

        expect(openQuestions().map((b) => b.textContent)).toEqual(['Un étranger peut-il acheter ?']);
        expect(within(panel()).getByRole('button', { name: 'Combien de temps pour acheter ?' })).toHaveAttribute('aria-expanded', 'false');
        expect(within(panel()).getByRole('link', { name: 'Contactez-nous' })).toHaveAttribute('href', '/contact');
        expect(within(panel()).getByRole('link', { name: 'Contacter un conseiller' })).toHaveAttribute('href', '/contact');
    });

    it('remembers the open questions per topic, syncs the URL hash and can expand / collapse a whole topic', async () => {
        const user = userEvent.setup();
        render();

        await user.click(within(panel()).getByRole('button', { name: 'Combien de temps pour acheter ?' }));
        expect(openQuestions()).toHaveLength(2);
        expect(window.location.hash).toBe('#combien-de-temps-pour-acheter');

        await user.click(screen.getByRole('tab', { name: 'Vendre un bien' }));
        expect(window.location.hash).toBe('#vendre-un-bien');
        await user.click(screen.getByRole('tab', { name: 'Acheter un bien' }));
        expect(openQuestions()).toHaveLength(2); // state kept per topic

        await user.click(within(panel()).getByRole('button', { name: 'Tout replier' }));
        expect(openQuestions()).toHaveLength(0);
        await user.click(within(panel()).getByRole('button', { name: 'Tout ouvrir' }));
        expect(openQuestions()).toHaveLength(2);
    });

    it('opens the topic and the question named in the URL hash', () => {
        window.location.hash = '#combien-de-temps-pour-vendre';
        render();

        expect(screen.getByRole('tab', { name: 'Vendre un bien' })).toHaveAttribute('aria-selected', 'true');
        expect(within(panel()).getByRole('button', { name: 'Combien de temps pour vendre ?' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('searches every topic, ignoring accents, and offers the contact form when nothing matches', async () => {
        const user = userEvent.setup();
        render();

        await user.type(screen.getByRole('searchbox', { name: 'Rechercher une question' }), 'etranger');
        expect(screen.getByRole('status')).toHaveTextContent('1 question correspond');
        expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument(); // topic panels hidden behind the results
        expect(screen.getByRole('button', { name: /Un étranger peut-il acheter/ })).toHaveAttribute('aria-expanded', 'true');

        await user.clear(screen.getByRole('searchbox'));
        await user.type(screen.getByRole('searchbox'), 'piscine');
        expect(screen.getByRole('status')).toHaveTextContent('Aucune question ne correspond');
        expect(screen.getByRole('link', { name: 'Poser ma question' })).toHaveAttribute('href', '/contact');

        await user.click(screen.getByRole('tab', { name: 'Vendre un bien' })); // picking a topic clears the search
        expect(screen.getByRole('searchbox')).toHaveValue('');
        expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('has no axe violations', async () => {
        const { container } = render();
        expect(await axe(container)).toHaveNoViolations();
    });
});
