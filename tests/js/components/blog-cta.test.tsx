import BlogCta from '@/components/blog/blog-cta';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('BlogCta', () => {
    it('renders the advisor card with eyebrow, title, text and a primary button to the contact page', async () => {
        const { container } = renderPage(
            <BlogCta
                section={{ _key: 'c1', _type: 'ctaBlock', title: 'Un projet à Paris ?', description: 'Parlons-en.', btnText: 'Prendre rendez-vous' }}
            />,
        );

        expect(screen.getByRole('complementary', { name: 'Un projet à Paris ?' })).toHaveClass('border-secondary-30');
        expect(screen.getByText('Parlons de votre projet')).toBeInTheDocument();
        expect(screen.getByText('Un projet à Paris ?').parentElement!.parentElement).toHaveClass('items-center', 'text-center'); // centred layout (ui.sh variant « Centré »)
        expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute('href', '/contact');
        expect(screen.getByText('MM')).toBeInTheDocument(); // advisor avatar (Radix shows the initials fallback until the photo loads)

        expect(await axe(container)).toHaveNoViolations();
    });

    it('falls back to the default button label', () => {
        renderPage(<BlogCta section={{ _key: 'c2', _type: 'ctaBlock' }} />);
        expect(screen.getByRole('link', { name: 'Nous contacter' })).toBeInTheDocument();
    });
});
