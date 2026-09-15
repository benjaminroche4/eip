import BlogToc from '@/components/blog/blog-toc';
import { type BlogSection } from '@/components/blog/types';
import { blogToc } from '@/lib/blog-toc';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const sections: BlogSection[] = [
    { _key: 'q1', _type: 'quickAnswerBlock', title: 'En bref', content: [] },
    { _key: 'w1', _type: 'wysiwygBlock', title: 'Comment acheter ?', content: [] },
    { _key: 'w2', _type: 'wysiwygBlock', content: [] },
    { _key: 'c1', _type: 'ctaBlock', title: 'Contactez-nous' },
    { _key: 't1', _type: 'tableBlock', caption: 'Prix' },
    { _key: 'f1', _type: 'faqBlock', items: [{ _key: 'i1', question: 'Q ?', answer: 'R.' }] },
    { _key: 'f2', _type: 'faqBlock', items: [] },
];

describe('blogToc', () => {
    it('keeps only titled quick answer / wysiwyg sections and non-empty FAQs (untitled FAQ gets the fallback)', () => {
        expect(blogToc(sections, 'Questions fréquentes')).toEqual([
            { id: 'q1', title: 'En bref' },
            { id: 'w1', title: 'Comment acheter ?' },
            { id: 'f1', title: 'Questions fréquentes' },
        ]);
    });
});

describe('BlogToc', () => {
    it('renders nothing without entries', () => {
        const { container } = renderPage(<BlogToc entries={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('lists anchor links to the sections under a « Sommaire » heading', async () => {
        const { container } = renderPage(<BlogToc entries={blogToc(sections, 'Questions fréquentes')} />);

        const nav = screen.getByRole('navigation', { name: 'Sommaire' });
        const links = screen.getAllByRole('link');
        expect(links.map((l) => l.getAttribute('href'))).toEqual(['#q1', '#w1', '#f1']);
        expect(links.map((l) => l.textContent)).toEqual(['En bref', 'Comment acheter ?', 'Questions fréquentes']);
        expect(nav).toBeInTheDocument(); // the sticky behaviour belongs to the page's side column
        expect(nav.querySelector('ol')).toHaveClass('max-h-72', 'overflow-y-auto'); // long articles scroll inside the card
        links.forEach((l) => expect(l).not.toHaveAttribute('aria-current')); // no active entry until a section scrolls into view

        expect(await axe(container)).toHaveNoViolations();
    });
});
