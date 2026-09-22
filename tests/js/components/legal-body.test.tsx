import LegalBody from '@/components/legal/legal-body';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('LegalBody', () => {
    it('highlights « Libellé : valeur » lines and keeps the other lines as prose', () => {
        const { container } = render(
            <LegalBody
                body={'Intro sans libellé.\n\nAdresse : 3 rue Test, 75006 Paris\nTéléphone : +33 1 00 00 00 00\nSite web : estate-in-paris.fr'}
            />,
        );

        expect(container.querySelector('p')!.className).toMatch(/whitespace-pre-line/);
        expect(container.querySelectorAll('p')).toHaveLength(2); // two paragraphs, split on the blank line
        const labels = Array.from(container.querySelectorAll('span')).map((s) => s.textContent);
        expect(labels).toEqual(['Adresse :', 'Téléphone :', 'Site web :']); // the intro line is not a label
        expect(container.querySelector('span')!.className).toMatch(/text-text-heading font-medium/);
        expect(container).toHaveTextContent('Téléphone : +33 1 00 00 00 00');
    });

    it('accepts the English « Label: value » shape too', () => {
        const { container } = render(<LegalBody body={'Phone: +33 1 00 00 00 00'} />);
        expect(container.querySelector('span')!.textContent).toBe('Phone :');
    });

    it('renders a block of « - » lines as a list with highlighted labels and no browser bullet', () => {
        const { container } = render(<LegalBody body={'Intro.\n\n- Données collectées : e-mail\n- Conservation : 3 ans\n\nSuite.'} />);
        const list = container.querySelector('ul')!;
        expect(list).toHaveAttribute('role', 'list');
        expect(Array.from(list.querySelectorAll('li')).map((li) => li.textContent)).toEqual([
            'Données collectées\u00a0: e-mail',
            'Conservation\u00a0: 3 ans',
        ]);
        expect(list.querySelector('li')!.className).toMatch(/before:bg-primary/);
        expect(list.querySelector('li span')!.className).toMatch(/text-text-heading/);
        expect(container.querySelectorAll('p')).toHaveLength(2);
    });
});
