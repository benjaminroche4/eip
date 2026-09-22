import SellPhoto from '@/components/sell/sell-photo';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('SellPhoto', () => {
    it('renders one wide, described, LCP-priority photo without anything interactive', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<SellPhoto />);

        const img = screen.getByRole('img', { name: /Estate in Paris vend à Paris/ });
        expect(img).toHaveAttribute('src', '/images/sell/photo-1600.jpg');
        expect(img).toHaveAttribute('fetchpriority', 'high');
        expect(img).toHaveAttribute('width', '1600');
        expect(img).toHaveAttribute('height', '630');
        expect(img.className).toContain('animate-hero-photo');
        expect(container.querySelector('section')).toHaveClass('-mx-6', 'aspect-video', 'lg:aspect-[21/9]');
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
