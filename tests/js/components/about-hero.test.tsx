import AboutHero from '@/components/about/about-hero';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

describe('AboutHero', () => {
    it('renders the header, the proof line, the photo and the message card with its controls', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<AboutHero />);

        expect(screen.getByRole('heading', { level: 1, name: "L'agence immobilière de prestige à Paris" })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Rencontrer nos conseillers' })).toHaveAttribute('href', '#team-title');
        expect(screen.getByText(/Basé sur 400 avis/)).toBeInTheDocument();
        expect(container.querySelector('img[src="/images/about/hero-1400.jpg"]')).not.toBeNull();
        // Photo flush with the header and the next band: the section cancels the layout's top padding and the gap below
        expect(container.querySelector('section')).toHaveClass('-mt-10', 'sm:-mt-12', 'lg:-mt-20', '-mb-12', 'lg:-mb-16');
        expect(container.querySelector('img[src="/images/about/hero-1400.jpg"]')!.parentElement!.className).not.toMatch(/border|ring|rounded/);
        const card = container.querySelector('[aria-live="polite"]')!;
        expect(card).toHaveClass('backdrop-blur-md', 'bg-black/40'); // dark glass, readable on the bright façade
        expect(card.querySelector('img')).toBeNull(); // icon tile, not a portrait
        expect(card.className).not.toMatch(/rounded/); // square corners
        expect(within(card as HTMLElement).getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");

        expect(await axe(container)).toHaveNoViolations();
    });

    it('cycles the messages with the dots, a swipe or the wheel on the card (mouse or finger) and the keyboard, without arrows', async () => {
        page.props = sharedProps();
        renderPage(<AboutHero />);
        const user = userEvent.setup();
        expect(screen.queryByRole('button', { name: /Message (suivant|précédent)/ })).toBeNull(); // dots only
        const card = document.querySelector('[aria-live="polite"]')!;
        expect(card).toHaveClass('cursor-grab', 'touch-pan-x');

        // Swipe up (finger or mouse) = next message, with the reel sliding up
        fireEvent.pointerDown(card, { clientY: 200 });
        fireEvent.pointerUp(card, { clientY: 140 });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        expect(card.querySelector('[aria-hidden="true"]')).toHaveClass('animate-reel-out-up', 'motion-reduce:hidden');
        expect(card.querySelector('[aria-hidden="true"]')).toHaveTextContent("25 ans d'expertise du marché");
        expect(screen.getByRole('heading', { level: 2 }).closest('.animate-reel-in-up')).not.toBeNull();
        expect(card).toHaveClass('transition-[height]', 'h-(--card-h)'); // the glass background follows the incoming message's height
        // A short drag does nothing
        fireEvent.pointerDown(card, { clientY: 200 });
        fireEvent.pointerUp(card, { clientY: 190 });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        // Swipe down = previous, twice wraps around
        fireEvent.pointerDown(card, { clientY: 100 });
        fireEvent.pointerUp(card, { clientY: 180 });
        expect(screen.getByRole('heading', { level: 2 }).closest('.animate-reel-in-down')).not.toBeNull();
        fireEvent.pointerDown(card, { clientY: 100 });
        fireEvent.pointerUp(card, { clientY: 180 });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Un accompagnement en français et en anglais'); // wraps around

        // Mouse wheel over the card: one notch = one message, with a cooldown; the page does not scroll meanwhile
        const wheel = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true });
        act(() => {
            card.dispatchEvent(wheel);
        });
        expect(wheel.defaultPrevented).toBe(true);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");
        act(() => {
            card.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true })); // within the cooldown: ignored
        });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");

        // Dots: click / Enter, and arrow keys on the group
        const dot = screen.getByRole('button', { name: 'Message 1 sur 3' });
        dot.focus();
        await user.keyboard('{Enter}');
        expect(dot).toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
    });
});
