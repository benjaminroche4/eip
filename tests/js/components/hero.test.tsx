import Hero from '@/components/home/hero';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('Hero', () => {
    it('renders the single h1, the answer-first sentence, the contact button and the three commitments', async () => {
        const { container } = renderPage(<Hero />);

        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("L'agence de l'exceptionnelà Paris.");
        const eyebrow = screen.getByText(/25 ans d'expertise/);
        expect(eyebrow).toHaveClass('uppercase');
        expect(eyebrow.querySelectorAll('span[aria-hidden]')).toHaveLength(2); // framed by two short rules (ui.sh variant « Surtitre avec traits »)
        expect(screen.getByText(/Estate in Paris, agence immobilière de prestige/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Contacter un conseiller' })).toHaveAttribute('href', '/contact');
        const values = within(screen.getByRole('list', { name: 'Nos engagements' })).getAllByRole('listitem');
        expect(values.map((li) => li.textContent)).toEqual([
            'Confidentiel et off-market',
            'Les meilleures adresses de Paris',
            'Un accompagnement de A à Z',
        ]);
        values.forEach((li) => expect(li.querySelector('svg')).not.toBeNull());
        expect(screen.getByRole('list', { name: 'Nos engagements' })).toHaveClass('overflow-x-auto', 'snap-x', 'snap-mandatory', 'cursor-grab'); // one line: snap carousel, draggable with the mouse on mobile
        expect(values[0]).toHaveClass('snap-center');
        expect(values[1].querySelector('span[aria-hidden]')).toHaveClass('via-white/60', 'bg-linear-to-b'); // gradient hairline separators, at every width
        expect(container.querySelector('video')).toHaveAttribute('poster', '/images/home/hero-1200.jpg'); // the photo only as the video's poster
        expect(container.querySelector('img')).toBeNull(); // no separate photo fading into the video
        // Reveal on load: the photo settles from a zoom, the content rises in cascade with increasing delays.
        expect(container.querySelector('video')).toHaveClass('animate-hero-photo');
        expect(screen.getByRole('heading', { level: 1 })).toHaveClass('animate-hero-rise');
        expect(screen.getByRole('heading', { level: 1 }).style.getPropertyValue('--stagger')).toBe('420ms');
        expect(screen.getByRole('list', { name: 'Nos engagements' }).style.getPropertyValue('--stagger')).toBe('780ms');
        expect(container.querySelector('section')).toHaveClass('min-h-svh'); // fills the first screen at every width

        expect(await axe(container, { preload: false })).toHaveNoViolations(); // preload: axe waits for the background video's metadata, which jsdom never loads
    });
});
