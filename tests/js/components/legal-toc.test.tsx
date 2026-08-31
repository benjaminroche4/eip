import LegalToc from '@/components/legal/legal-toc';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const headings = ['Éditeur du site', 'Hébergement', 'Propriété intellectuelle'];

/** Fake page sections the scrollspy reads: one element per heading, at the given viewport tops. */
const mountSections = (tops: number[]) =>
    tops.forEach((top, index) => {
        const section = document.createElement('section');
        section.id = `legal-section-${index}`;
        vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
        document.body.append(section);
    });

describe('LegalToc', () => {
    afterEach(() => {
        document.querySelectorAll('section[id^="legal-section-"]').forEach((s) => s.remove());
    });

    it('lists one keyboard-reachable anchor link per section, in its own nav landmark', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<LegalToc headings={headings} />);

        const nav = screen.getByRole('navigation', { name: 'Sommaire' });
        const links = within(nav).getAllByRole('link');
        expect(links).toHaveLength(3);
        expect(links[0]).toHaveAccessibleName('Éditeur du site'); // the 01 number is decorative (aria-hidden)
        expect(links[0]).toHaveAttribute('href', '#legal-section-0');
        expect(links[2]).toHaveAttribute('href', '#legal-section-2');
        expect(links[0]).toHaveAttribute('aria-current', 'true'); // top of page: first section is current

        await user.tab(); // the mobile "Sommaire" dropdown trigger comes first in the DOM
        expect(screen.getByRole('button', { name: /Sommaire/ })).toHaveFocus();
        await user.tab();
        expect(links[0]).toHaveFocus();
        await user.tab();
        expect(links[1]).toHaveFocus();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('moves the sand highlight to the section being read (scrollspy)', async () => {
        mountSections([-300, 80, 900]); // reading the second section: its top passed under the header
        renderPage(<LegalToc headings={headings} />);

        const nav = screen.getByRole('navigation', { name: 'Sommaire' });
        const links = within(nav).getAllByRole('link');
        expect(links[1]).toHaveAttribute('aria-current', 'true');
        expect(links[0]).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('button', { name: /Sommaire/ })).toHaveTextContent('Hébergement'); // the dropdown follows

        document.getElementById('legal-section-2')!.getBoundingClientRect = () => ({ top: 40 }) as DOMRect;
        window.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(links[2]).toHaveAttribute('aria-current', 'true'));
    });
});
