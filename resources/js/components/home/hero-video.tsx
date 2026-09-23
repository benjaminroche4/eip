import { useEffect, useRef } from 'react';

/**
 * Background video of the home hero (2026-09-23): decorative (`aria-hidden`, muted, looping, inline), rendered in the
 * SSR HTML with the hero photo as its `poster` so the browser starts fetching it at once and the first frame shows
 * as soon as it is decoded — no separate photo fading into the video (user decision 2026-09-23: the photo-first
 * reveal was rejected). The poster only covers the instant before the first frame and the reduced-motion / Data
 * Saver / 2G cases, where the effect pauses the video on the poster. Two sizes (720 px below `sm`, 1280 px above) in
 * WebM VP9 first and MP4 H.264 as the fallback — encoded from the owner's clip with ffmpeg (10 s, 24 fps, no audio,
 * `faststart`), see docs/decisions.md.
 */
export default function HeroVideo() {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        // React does not always reflect `muted` as an attribute: set the property too, or autoplay is refused.
        video.muted = true;
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
        const still =
            window.matchMedia('(prefers-reduced-motion: reduce)').matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '');
        if (still) {
            video.removeAttribute('autoplay');
            video.pause();
        }
    }, []);

    return (
        <video
            ref={ref}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/home/hero-1200.jpg"
            aria-hidden
            className="animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none"
        >
            <source src="/videos/home/hero-720.webm" type="video/webm" media="(max-width: 40rem)" />
            <source src="/videos/home/hero-720.mp4" type="video/mp4" media="(max-width: 40rem)" />
            <source src="/videos/home/hero-1280.webm" type="video/webm" />
            <source src="/videos/home/hero-1280.mp4" type="video/mp4" />
        </video>
    );
}
