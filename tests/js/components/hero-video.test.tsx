import HeroVideo from '@/components/home/hero-video';
import BackgroundVideo from '@/components/page/background-video';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('HeroVideo', () => {
    afterEach(() => vi.restoreAllMocks());

    it('renders a muted, looping, inline, decorative video with the photo as poster, WebM first and MP4 fallback in two sizes', () => {
        const { container } = render(<HeroVideo />);
        const video = container.querySelector('video')!;
        expect(video).toHaveAttribute('aria-hidden');
        expect(video).toHaveAttribute('loop');
        expect(video).toHaveAttribute('playsinline');
        expect(video).toHaveAttribute('autoplay');
        expect(video).toHaveAttribute('poster', '/images/home/hero-1200.jpg');
        expect(video.muted).toBe(true);
        expect(video).not.toHaveClass('opacity-0'); // shown at once, no fade from a photo
        expect(Array.from(container.querySelectorAll('source')).map((s) => s.getAttribute('src'))).toEqual([
            '/videos/home/hero-720.webm',
            '/videos/home/hero-720.mp4',
            '/videos/home/hero-1280.webm',
            '/videos/home/hero-1280.mp4',
        ]);
        expect(container.querySelector('source')).toHaveAttribute('media', '(max-width: 40rem)');
    });

    it('is the shared BackgroundVideo: another clip and poster for the Buy hero', () => {
        const { container } = render(<BackgroundVideo base="/videos/buy/hero" poster="/images/buy/hero-poster-1280.jpg" />);
        expect(container.querySelector('video')).toHaveAttribute('poster', '/images/buy/hero-poster-1280.jpg');
        expect(container.querySelectorAll('source')[3]).toHaveAttribute('src', '/videos/buy/hero-1280.mp4');
    });

    it('stays on the poster under prefers-reduced-motion (autoplay removed)', () => {
        vi.spyOn(window, 'matchMedia').mockImplementation(
            (query: string) =>
                ({
                    matches: query.includes('reduced-motion'),
                    media: query,
                    onchange: null,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                }) as MediaQueryList,
        );
        vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        const { container } = render(<HeroVideo />);
        expect(container.querySelector('video')).not.toHaveAttribute('autoplay');
    });
});
