import AgencyManifesto, { type AgencyStat } from '@/components/about/agency-manifesto';
import { act, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const stats: AgencyStat[] = [
    { value: '250 M€+', title: 'Transactions réalisées', text: 'Dans les quartiers les plus prisés de Paris.' },
    { value: '25+', title: "Années d'expertise du marché", text: 'Sur le marché immobilier de prestige parisien.' },
    { value: '500+', title: 'Biens vendus et loués', text: "Résidences de prestige et biens d'investissement." },
    { value: '120+', title: 'Acquéreurs qualifiés actifs chaque mois', text: "Accédez à notre réseau d'acheteurs sérieux." },
];

describe('AgencyManifesto', () => {
    it('renders the manifesto with the brand in semibold, the key mark and the four key figures', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<AgencyManifesto stats={stats} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Qui sommes-nous ?' })).toBeInTheDocument();
        // GEO statement: brand + street + district, no stray space before the comma
        expect(container.querySelector('p')).toHaveTextContent(/^Estate in Paris, agence installée rue Grégoire de Tours à Paris 6e, allie/);
        container.querySelectorAll('p > span.font-semibold').forEach((w) => expect(['Estate', 'in', 'Paris']).toContain(w.textContent));
        // Brand key mark as a decorative watermark (the Figma vector is this very glyph)
        const mark = container.querySelector('img[src="/brand/logo-mark.svg"]')!;
        expect(mark).toHaveAttribute('alt', '');
        expect(mark).toHaveClass('opacity-30');

        const items = within(container.querySelector('ul')!).getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(within(items[3]).getByRole('heading', { level: 3, name: 'Acquéreurs qualifiés actifs chaque mois' })).toBeInTheDocument();
        // Grid: stacked, 2×2 from sm, four columns from lg; gradient hairlines between (never dotted borders)
        const grid = container.querySelector('ul')!;
        expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-4');
        expect(grid.querySelectorAll(':scope > [aria-hidden].sm\\:hidden')).toHaveLength(2); // mobile-only rules
        expect(grid.querySelectorAll(':scope > [aria-hidden].sm\\:col-span-2')).toHaveLength(1); // between the two rows
        expect(items[1]).toHaveClass('sm:before:block'); // vertical rule on the second column
        expect(items[2]).toHaveClass('lg:before:block');
        expect(container.querySelector('section')).toHaveClass('from-background-05', 'to-background', 'bg-linear-to-b'); // the site's sand band
        expect(container.innerHTML).not.toMatch(/border-dotted|shadow/);

        // Reveal, word by word: every word is its own span staggered 40 ms after the previous one (title → statements),
        // the mark closes the sequence; jsdom has no IntersectionObserver so the reveal is immediate here.
        const title = screen.getByRole('heading', { level: 2, name: 'Qui sommes-nous ?' });
        const titleWords = title.querySelectorAll('span');
        expect(titleWords).toHaveLength(3); // « Qui sommes-nous ? » = three words written one by one
        expect(titleWords[0]).toHaveClass('animate-manifesto-in', 'motion-reduce:animate-none');
        expect(titleWords[0].style.getPropertyValue('--stagger')).toBe('0ms');
        expect(titleWords[2].style.getPropertyValue('--stagger')).toBe('80ms');
        expect(screen.getByText('Estate').style.getPropertyValue('--stagger')).toBe('120ms'); // brand right after the title
        const wordCount = title.parentElement!.querySelectorAll('h2 span, p > span').length;
        expect((mark as HTMLElement).style.getPropertyValue('--stagger')).toBe(`${wordCount * 40}ms`);

        // Figures: accessible text = the final value from the start, title + text rise in cascade (120 ms apart)
        expect(items[0].querySelector('.sr-only')).toHaveTextContent('250 M€+');
        expect(items[1].querySelector('h3')!.parentElement).toHaveClass('animate-hero-rise');
        expect(items[1].style.getPropertyValue('--stagger')).toBe('120ms');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('counts each figure up to its value, keeping the prefix, suffix and grouping as written', async () => {
        vi.useFakeTimers();
        let now = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => now);
        const frames: FrameRequestCallback[] = [];
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
        page.props = sharedProps();
        const { container } = renderPage(<AgencyManifesto stats={stats} />);
        const visible = () => Array.from(container.querySelectorAll('li p[class*="font-heading"] [aria-hidden]')).map((el) => el.textContent);

        expect(visible()).toEqual(['0 M€+', '0+', '0+', '0+']); // starts from zero
        await act(async () => {
            now = 700;
            frames.splice(0).forEach((cb) => cb(now));
        });
        const halfway = visible();
        expect(halfway[0]).not.toBe('0 M€+');
        expect(halfway[0]).not.toBe('250 M€+');
        await act(async () => {
            now = 1400;
            frames.splice(0).forEach((cb) => cb(now));
        });
        expect(visible()).toEqual(['250 M€+', '25+', '500+', '120+']);
        expect(frames).toHaveLength(0); // the loop stops at the target
        vi.useRealTimers();
    });

    it('shows the final figures at once under prefers-reduced-motion', () => {
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: query.includes('reduce'),
                    media: query,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                }) as unknown as MediaQueryList,
        );
        const raf = vi.spyOn(window, 'requestAnimationFrame');
        page.props = sharedProps();
        const { container } = renderPage(<AgencyManifesto stats={stats} />);

        expect(Array.from(container.querySelectorAll('li p[class*="font-heading"] [aria-hidden]')).map((el) => el.textContent)).toEqual([
            '250 M€+',
            '25+',
            '500+',
            '120+',
        ]);
        expect(raf).not.toHaveBeenCalled();
    });

    it('renders the text alone, without the figures grid, when no stats are given (home)', () => {
        page.props = sharedProps();
        const { container } = renderPage(<AgencyManifesto />);

        expect(screen.getByRole('heading', { level: 2, name: 'Qui sommes-nous ?' })).toBeInTheDocument();
        expect(container.querySelector('ul')).toBeNull();
    });
});
