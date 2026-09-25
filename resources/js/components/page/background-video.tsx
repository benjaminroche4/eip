import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type BackgroundVideoProps = {
    /** Path prefix of the four encodings: `{base}-{small}.webm|mp4` (below `sm`) and `{base}-{large}.webm|mp4`. */
    base: string;
    /** Pixel widths of the two encodings, `[small, large]` (default 720 / 1280; the portrait About clip uses 640 / 856). */
    widths?: [number, number];
    /** Still shown until the first frame decodes, and kept under reduced motion / Data Saver / 2G. */
    poster: string;
    className?: string;
};

/**
 * Decorative background clip (home hero 2026-09-23, Buy hero the same day): `aria-hidden`, muted, looping, inline,
 * rendered in the SSR HTML with a photo as its `poster` so the browser starts fetching at once and the first frame
 * shows as soon as it is decoded — no separate photo fading into the video (user decision 2026-09-23: the
 * photo-first reveal was rejected). The poster only covers the instant before the first frame and the reduced-motion /
 * Data Saver / 2G cases, where the effect pauses the video on the poster. Two sizes (720 px below `sm`, 1280 px
 * above) in WebM VP9 first and MP4 H.264 as the fallback — encoded from the owner's clips with ffmpeg (10 s, 24 fps,
 * no audio, `faststart`), see docs/decisions.md.
 */
export default function BackgroundVideo({ base, poster, className, widths = [720, 1280] }: BackgroundVideoProps) {
    const [small, large] = widths;
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
            poster={poster}
            aria-hidden
            className={cn('animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none', className)}
        >
            <source src={`${base}-${small}.webm`} type="video/webm" media="(max-width: 40rem)" />
            <source src={`${base}-${small}.mp4`} type="video/mp4" media="(max-width: 40rem)" />
            <source src={`${base}-${large}.webm`} type="video/webm" />
            <source src={`${base}-${large}.mp4`} type="video/mp4" />
        </video>
    );
}
