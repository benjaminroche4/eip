import ValuesMarquee from '@/components/about/values-marquee';
import { screen } from '@testing-library/react';
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
        expect(track.className).toContain('motion-reduce:animate-none');

        expect(await axe(container)).toHaveNoViolations();
    });
});
