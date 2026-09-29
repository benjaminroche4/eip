import PropertyDescription from '@/components/properties/property-description';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

describe('PropertyDescription', () => {
    it('sets the first paragraph as the lead, then the rest in the body colour separated by hairlines (ui.sh « Filets entre paragraphes », 2026-09-29); the excerpt alone without a description', async () => {
        page.props = sharedProps();
        const description = ['Premier paragraphe, en accroche.', 'Deuxième paragraphe.', 'Troisième paragraphe.'];
        const { container, rerender } = renderPage(<PropertyDescription property={{ ...PROPERTY, description }} />);

        expect(screen.getByText(description[0])).toHaveClass('text-lg/9', 'text-foreground');
        expect(screen.getByText(description[1])).toHaveClass('text-muted-foreground');
        expect(screen.getByText(description[0]).parentElement).toHaveClass('divide-y'); // a hairline between paragraphs
        // The photo carousel sits between the lead and the rest (user request 2026-09-29): the cards' snap carousel, 16/9
        const carousel = screen.getByRole('group', { name: 'Photos du bien' }); // its own name: the gallery already says « Photos de … »
        expect(screen.getByText(description[0]).nextElementSibling).toContainElement(carousel);
        expect(carousel.querySelector('img')).toHaveClass('aspect-video');
        expect(screen.getByRole('button', { name: 'Photo suivante' })).toBeInTheDocument();
        expect(container.querySelector('.bg-secondary-60.h-px')).toBeNull(); // no sand rule any more
        expect(await axe(container)).toHaveNoViolations();

        rerender(<PropertyDescription property={{ ...PROPERTY, description: undefined }} />);
        expect(screen.getByText(PROPERTY.excerpt)).toHaveClass('text-lg/9');
        expect(container.querySelectorAll('p:not([aria-live])')).toHaveLength(1);
    });
});
