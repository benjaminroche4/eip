import BlogTags from '@/components/blog/blog-tags';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('BlogTags', () => {
    it('lists the tags as square outlined chips under a « Mots-clés » label', async () => {
        const { container } = renderPage(<BlogTags tags={['prix m2 paris', 'dpe 2026']} />);

        expect(screen.getByText('Mots-clés')).toBeInTheDocument();
        const items = screen.getAllByRole('listitem');
        expect(items.map((li) => li.textContent)).toEqual(['prix m2 paris', 'dpe 2026']);
        items.forEach((li) => expect(li).toHaveClass('border', 'rounded-none'));
        expect(screen.queryByRole('link')).toBeNull(); // chips, no tag page

        expect(await axe(container)).toHaveNoViolations();
    });

    it('renders nothing without tags', () => {
        const { container } = renderPage(<BlogTags tags={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
