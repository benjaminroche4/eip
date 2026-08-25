import OpenBadge from '@/components/footer/open-badge';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, renderPage, sharedProps } from '../inertia';

describe('OpenBadge', () => {
    it('shows the label with a decorative shimmer that stays out of the accessible tree', () => {
        page.props = sharedProps();
        renderPage(<OpenBadge />);

        const badge = screen.getByText('Ouvert').parentElement!;
        expect(badge).toHaveTextContent(/^Ouvert$/);
        const shimmer = badge.querySelector('.ring-mask');
        expect(shimmer).not.toBeNull();
        expect(shimmer).toHaveAttribute('aria-hidden');
    });

    it('renders nothing outside opening hours', () => {
        page.props = sharedProps({ seo: { ...sharedProps().seo, hours: { ...sharedProps().seo.hours, open: false } } });
        const { container } = renderPage(<OpenBadge />);
        expect(container).toBeEmptyDOMElement();
        page.props = sharedProps();
    });
});
