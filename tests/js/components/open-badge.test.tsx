import OpenBadge from '@/components/footer/open-badge';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { page, renderPage, sharedProps } from '../inertia';

describe('OpenBadge', () => {
    it('shows the label during opening hours, without decorative extras', () => {
        page.props = sharedProps();
        renderPage(<OpenBadge />);

        const badge = screen.getByText('Ouvert');
        expect(badge).toHaveTextContent(/^Ouvert$/);
        expect(badge.querySelector('.ring-mask')).toBeNull();
    });

    it('renders nothing outside opening hours', () => {
        page.props = sharedProps({ seo: { ...sharedProps().seo, hours: { ...sharedProps().seo.hours, open: false } } });
        const { container } = renderPage(<OpenBadge />);
        expect(container).toBeEmptyDOMElement();
        page.props = sharedProps();
    });
});
