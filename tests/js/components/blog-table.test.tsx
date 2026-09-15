import BlogTable from '@/components/blog/blog-table';
import { type TableSection } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const section: TableSection = {
    _key: 't1',
    _type: 'tableBlock',
    caption: 'Marché du prestige à Paris',
    firstRowIsHeader: true,
    firstColumnIsHeader: true,
    table: {
        rows: [
            { _key: 'r0', cells: ['Indicateur', '2026'] },
            { _key: 'r1', cells: ['Prix moyen', '13 500 € / m²'] },
            { _key: 'r2', cells: ['Délai de vente', '58 jours'] },
        ],
    },
};

describe('BlogTable', () => {
    it('renders the Figma table: grey header row, row headers muted, values in the heading colour, square corners', async () => {
        const { container } = renderPage(<BlogTable section={section} />);

        expect(screen.getByRole('table', { name: 'Marché du prestige à Paris' })).toBeInTheDocument();
        const [h1, h2] = screen.getAllByRole('columnheader');
        expect(h1).toHaveTextContent('Indicateur');
        expect(h1.parentElement).toHaveClass('bg-grey-5');
        expect(h2).toHaveClass('text-xs', 'font-medium');
        const rowHeader = screen.getByRole('rowheader', { name: 'Prix moyen' });
        expect(rowHeader).toHaveClass('text-muted-foreground', 'font-normal');
        expect(screen.getByRole('cell', { name: '13 500 € / m²' })).toHaveClass('text-text-heading', 'font-medium');
        expect(container.querySelector('[class*="rounded"]')).toBeNull();
        expect(container.firstElementChild).toHaveClass('overflow-x-auto');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('renders nothing without rows and no header row when the first row is data', () => {
        const { container } = renderPage(<BlogTable section={{ ...section, table: { rows: [] } }} />);
        expect(container).toBeEmptyDOMElement();

        renderPage(<BlogTable section={{ ...section, firstRowIsHeader: false }} />);
        expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
        expect(screen.getAllByRole('row')).toHaveLength(3);
    });
});
