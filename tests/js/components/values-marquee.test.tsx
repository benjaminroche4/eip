import ValuesMarquee from '@/components/about/values-marquee';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('ValuesMarquee', () => {
    it('renders the five commitments once for assistive tech, twice for the endless track, paused on hover', async () => {
        const { container } = renderPage(<ValuesMarquee />);

        const region = screen.getByRole('region', { name: 'Nos engagements' });
        expect(region).toHaveClass('bg-background-05'); // same sand as the top of the manifesto band below
        expect(screen.getAllByText('La transparence à chaque transaction')).toHaveLength(6); // two halves of three lists
        expect(container.querySelectorAll('ul[aria-hidden="true"]')).toHaveLength(5); // only the first list is exposed
        const track = container.querySelector('.animate-marquee')!;
        expect(track.className).toContain('group-hover:[animation-play-state:paused]');
        expect(track.className).toContain('group-focus-within:[animation-play-state:paused]'); // and while a control inside has the focus
        expect(track.className).toContain('motion-reduce:animate-none');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('can be paused and resumed with a button (WCAG 2.2.2), and pauses under the finger', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<ValuesMarquee />);
        const track = container.querySelector('.animate-marquee')!;
        const paused = () => track.className.includes(' [animation-play-state:paused]');

        const button = screen.getByRole('button', { name: 'Mettre en pause le défilement' });
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(button.querySelector('svg')).toHaveClass('lucide-pause');
        expect(paused()).toBe(false);

        await user.tab();
        expect(button).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveAccessibleName('Reprendre le défilement');
        expect(button.querySelector('svg')).toHaveClass('lucide-play');
        expect(paused()).toBe(true);
        await user.keyboard(' ');
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(paused()).toBe(false);

        const region = screen.getByRole('region', { name: 'Nos engagements' });
        fireEvent.touchStart(region);
        expect(paused()).toBe(true);
        fireEvent.touchEnd(region);
        expect(paused()).toBe(false);
    });
});
