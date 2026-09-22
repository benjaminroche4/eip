import BlogBody from '@/components/blog/blog-body';
import { type BlogSection } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const sections: BlogSection[] = [
    {
        _key: 'q1',
        _type: 'quickAnswerBlock',
        title: 'Faut-il un visa pour acheter ?',
        content: [{ _key: 'b1', _type: 'block', style: 'normal', children: [{ _key: 's1', _type: 'span', text: 'Non, aucun visa.' }] }],
    },
    { _key: 'q2', _type: 'quickAnswerBlock', content: [] },
];

describe('BlogBody quick answer', () => {
    it('stands out as a double card (sand frame + white inner card), h2 falling back to « Réponse rapide »', async () => {
        const { container } = renderPage(<BlogBody sections={sections} />);

        const blocks = screen.getAllByRole('complementary');
        expect(blocks[0]).toHaveClass('bg-background-08', 'p-2');
        expect(blocks[0].querySelector('h2 > span[aria-hidden] svg')).not.toBeNull(); // icon in a white square tile before the title
        expect(blocks[0].querySelector('h2 > span[aria-hidden]')!.className).toMatch(/bg-card/);
        expect(blocks[0].querySelector('.bg-card')).not.toBeNull(); // inner white card (Relocation in Paris pattern)
        expect(blocks[0]).toHaveAttribute('id', 'q1');
        expect(screen.getAllByText('Réponse rapide')).toHaveLength(1); // only the untitled block's h2 (no eyebrow any more)
        expect(screen.getByRole('heading', { level: 2, name: 'Faut-il un visa pour acheter ?' })).toBeInTheDocument();
        expect(screen.getByText('Non, aucun visa.')).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('shows « Réponse rapide » once when the Sanity title is the same words', () => {
        renderPage(<BlogBody sections={[{ _key: 'q3', _type: 'quickAnswerBlock', title: 'Réponse rapide', content: [] }]} />);
        expect(screen.getAllByText('Réponse rapide')).toHaveLength(1);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Réponse rapide');
    });
});

describe('BlogBody background section (conclusion)', () => {
    it('uses the same double card and title size as the quick answer', () => {
        renderPage(
            <BlogBody
                sections={[
                    { _key: 'w1', _type: 'wysiwygBlock', title: 'Ce qu’il faut retenir', background: true, content: [] },
                    { _key: 'w2', _type: 'wysiwygBlock', title: 'Étape 1', content: [] },
                ]}
            />,
        );

        const conclusion = document.getElementById('w1')!;
        expect(conclusion).toHaveClass('bg-background-08', 'p-2');
        expect(conclusion.querySelector('.bg-card')).not.toBeNull();
        expect(screen.getByRole('heading', { level: 2, name: 'Ce qu’il faut retenir' })).toHaveClass('text-lg', 'font-medium');
        expect(screen.getByRole('heading', { level: 2, name: 'Étape 1' })).toHaveClass('text-2xl'); // regular sections keep the section scale
    });
});
