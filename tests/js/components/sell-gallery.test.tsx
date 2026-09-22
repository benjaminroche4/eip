import SellGallery from '@/components/sell/sell-gallery';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ALTS = ['Salon à Saint-Germain', 'Chambre lumineuse', 'Cuisine ouverte', 'Terrasse sur les toits'];

describe('SellGallery', () => {
    it('renders four described lazy photos, the first one spanning the mosaic, nothing interactive', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<SellGallery alts={ALTS} />);

        expect(screen.getByRole('region', { name: 'Biens vendus par Estate in Paris' })).toBeInTheDocument();
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(items[0]).toHaveClass('col-span-2', 'lg:row-span-2');
        expect(items[1]).not.toHaveClass('col-span-2');
        const imgs = screen.getAllByRole('img');
        expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(ALTS);
        expect(imgs[0]).toHaveAttribute('src', '/images/sell/gallery-1-1600.jpg');
        expect(imgs[0]).toHaveAttribute('loading', 'lazy');
        expect(container.querySelectorAll('a, button')).toHaveLength(0);

        expect(await axe(container)).toHaveNoViolations();
    });
});
