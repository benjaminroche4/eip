import ReadingProgress from '@/components/blog/reading-progress';
import { act, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('ReadingProgress', () => {
    it('exposes a progress bar that follows the scroll through the target element', async () => {
        const target = createRef<HTMLElement>();
        const article = document.createElement('article');
        Object.defineProperty(article, 'offsetHeight', { value: 3000 });
        article.getBoundingClientRect = () => ({ top: -window.scrollY, height: 3000 }) as DOMRect;
        document.body.appendChild(article);
        (target as { current: HTMLElement | null }).current = article;
        Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

        const { container } = renderPage(<ReadingProgress target={target} />);
        const bar = screen.getByRole('progressbar', { name: 'Progression de la lecture' });
        expect(bar).toHaveAttribute('aria-valuenow', '0');

        await act(async () => {
            window.scrollY = 1000; // half of the 2000px scrollable span
            window.dispatchEvent(new Event('scroll'));
            await new Promise((r) => requestAnimationFrame(() => r(null)));
        });
        expect(bar).toHaveAttribute('aria-valuenow', '50');
        expect(bar.style.getPropertyValue('--progress')).toBe('50%');

        expect(await axe(container)).toHaveNoViolations();
        article.remove();
    });

    it('stays at 0 for an article shorter than the viewport (nothing to read through)', () => {
        const target = createRef<HTMLElement>();
        const article = document.createElement('article');
        Object.defineProperty(article, 'offsetHeight', { value: 600 });
        article.getBoundingClientRect = () => ({ top: 0, height: 600 }) as DOMRect;
        document.body.appendChild(article);
        (target as { current: HTMLElement | null }).current = article;
        Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
        window.scrollY = 0;

        renderPage(<ReadingProgress target={target} />);
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
        article.remove();
    });
});
