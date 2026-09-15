import PortableText from '@/components/blog/portable-text';
import { type PortableNode } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const block = (key: string, text: string, listItem?: 'bullet' | 'number'): PortableNode => ({
    _key: key,
    _type: 'block',
    style: 'normal',
    listItem,
    children: [{ _key: `${key}s`, _type: 'span', text }],
});

describe('PortableText lists', () => {
    it('draws a primary dot for bullets and a numbered sand disc for ordered lists', async () => {
        const { container } = renderPage(
            <PortableText
                value={[
                    block('a', 'Un'),
                    block('b', 'Deux', 'bullet'),
                    block('c', 'Trois', 'bullet'),
                    block('d', 'Quatre', 'number'),
                    block('e', 'Cinq', 'number'),
                ]}
            />,
        );

        const lists = screen.getAllByRole('list');
        expect(lists).toHaveLength(2);
        expect(lists[0].tagName).toBe('UL');
        expect(lists[0]).not.toHaveClass('bg-grey-5'); // a grey well was tried and removed (user decision)
        expect(lists[0].querySelector('li')).toHaveClass('before:bg-primary', 'before:rounded-full');
        expect(lists[1].tagName).toBe('OL');
        expect(lists[1]).toHaveClass('[counter-reset:item]');
        expect(lists[1].querySelector('li')).toHaveClass('before:content-[counter(item)]', 'before:bg-background-08');
        expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Deux', 'Trois', 'Quatre', 'Cinq']);

        expect(await axe(container)).toHaveNoViolations();
    });
});

describe('PortableText blockquote', () => {
    it('renders a pull quote as a double card with a quotation mark', () => {
        const { container } = renderPage(<PortableText value={[{ ...block('q', 'Trois sources officielles suffisent.'), style: 'blockquote' }]} />);

        const quote = container.querySelector('blockquote')!;
        expect(quote).toHaveClass('bg-background-08', 'p-2'); // double card, like the quick answer
        expect(quote.querySelector('.bg-card')).not.toBeNull();
        expect(quote.querySelector('svg.lucide-quote')).not.toBeNull();
        expect(quote).not.toHaveClass('italic');
        expect(quote).toHaveTextContent('Trois sources officielles suffisent.');
    });
});

describe('PortableText image', () => {
    it('shows the alt as a caption with an info icon, and no caption without alt', () => {
        const image = { url: '/img.jpg', srcset: '/img.jpg 800w', width: 1200, height: 800, alt: '' };
        const { container } = renderPage(
            <PortableText
                value={[
                    { _key: 'i1', _type: 'image', alt: 'Vue sur les toits de Paris', image },
                    { _key: 'i2', _type: 'image', image },
                ]}
            />,
        );

        const figures = container.querySelectorAll('figure');
        expect(figures[0].querySelector('figcaption')).toHaveTextContent('Vue sur les toits de Paris');
        expect(figures[0].querySelector('figcaption svg.lucide-info')).not.toBeNull();
        expect(figures[0].querySelector('img')).toHaveAttribute('alt', 'Vue sur les toits de Paris');
        expect(figures[1].querySelector('figcaption')).toBeNull();
    });
});
