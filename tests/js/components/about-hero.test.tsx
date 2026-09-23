import AboutHero from '@/components/about/about-hero';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
        expect(card).toHaveClass('cursor-grab', 'touch-pan-y'); // the finger still scrolls the page over the card (2026-09-22)

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

        // Mouse wheel over the card: on the last message a notch down is NOT trapped (no wrap): the page scrolls on (2026-09-22)
        const past = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true });
        act(() => {
            card.dispatchEvent(past);
        });
        expect(past.defaultPrevented).toBe(false);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Un accompagnement en français et en anglais');
        // A notch up = previous message, with a cooldown; the page does not scroll meanwhile
        const wheel = new WheelEvent('wheel', { deltaY: -120, cancelable: true, bubbles: true });
        act(() => {
            card.dispatchEvent(wheel);
        });
        expect(wheel.defaultPrevented).toBe(true);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        act(() => {
            card.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, cancelable: true, bubbles: true })); // within the cooldown: ignored
        });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');

        // Dots: click / Enter, and arrow keys on the group — roving tabindex, the focus follows the message (2026-09-22)
        const dot = screen.getByRole('button', { name: 'Message 1 sur 3' });
        dot.focus();
        await user.keyboard('{Enter}');
        expect(dot).toHaveAttribute('aria-current', 'true');
        expect(dot).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('button', { name: 'Message 2 sur 3' })).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");
        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        expect(screen.getByRole('button', { name: 'Message 2 sur 3' })).toHaveFocus();
        expect(screen.getByRole('button', { name: 'Message 2 sur 3' })).toHaveAttribute('tabindex', '0');
        expect(dot).toHaveAttribute('tabindex', '-1');
        await user.keyboard('{ArrowUp}{ArrowUp}'); // wraps around on the keyboard
        expect(screen.getByRole('button', { name: 'Message 3 sur 3' })).toHaveFocus();
        // The wheel before the first message goes through too
        await user.click(dot);
        const before = new WheelEvent('wheel', { deltaY: -120, cancelable: true, bubbles: true });
        act(() => {
            card.dispatchEvent(before);
        });
        expect(before.defaultPrevented).toBe(false);
        expect(dot).toHaveAttribute('aria-current', 'true');
    });

    it('on touch, only a quick flick changes the message and the gesture is never blocked (2026-09-22)', () => {
        page.props = sharedProps();
        renderPage(<AboutHero />);
        const card = document.querySelector('[aria-live="polite"]')!;
        const now = vi.spyOn(Date, 'now');

        // Slow finger movement = the page scrolling: ignored
        now.mockReturnValue(1000);
        const down = fireEvent.pointerDown(card, { clientY: 200, pointerType: 'touch' });
        expect(down).toBe(true); // not prevented
        now.mockReturnValue(1600);
        fireEvent.pointerUp(card, { clientY: 120, pointerType: 'touch' });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent("25 ans d'expertise du marché");

        // Quick flick of 80px: next message
        now.mockReturnValue(2000);
        fireEvent.pointerDown(card, { clientY: 200, pointerType: 'touch' });
        now.mockReturnValue(2150);
        fireEvent.pointerUp(card, { clientY: 120, pointerType: 'touch' });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        now.mockRestore();
    });

    it('settles the reel at once under prefers-reduced-motion (no animationend ever fires)', () => {
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: query.includes('reduce'),
                    media: query,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                }) as unknown as MediaQueryList,
        );
        page.props = sharedProps();
        renderPage(<AboutHero />);
        const card = document.querySelector('[aria-live="polite"]')!;

        fireEvent.pointerDown(card, { clientY: 200 });
        fireEvent.pointerUp(card, { clientY: 140 });
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Des ventes discrètes, hors marché');
        expect(card.querySelector('.animate-reel-out-up, .animate-reel-out-down')).toBeNull(); // no leaving copy left behind
        expect(screen.getByRole('heading', { level: 2 }).closest('.animate-reel-in-up')).toBeNull(); // no reel class kept forever
        vi.restoreAllMocks();
    });
});
