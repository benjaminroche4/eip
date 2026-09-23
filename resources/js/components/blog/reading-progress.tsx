import { useTranslation } from '@/hooks/use-translation';
import { type CSSProperties, type RefObject, useEffect, useState } from 'react';

type ReadingProgressProps = { target: RefObject<HTMLElement | null> };

/**
 * Reading progress: a hairline fixed at the very top of the viewport, growing as the reader scrolls through `target`
 * (0 at its top, 100 when its bottom reaches the viewport). One read per animation frame, SSR-safe (0 on the server).
 */
export default function ReadingProgress({ target }: ReadingProgressProps) {
    const { t } = useTranslation();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;
        const read = () => {
            frame = 0;
            const el = target.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            const span = el.offsetHeight - window.innerHeight;
            const ratio = span <= 0 ? 0 : (window.scrollY - top) / span; // an article shorter than the viewport has nothing to read through: 0, not 100
            setProgress(Math.round(Math.min(1, Math.max(0, ratio)) * 100));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(read);
        };
        read();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [target]);

    return (
        <div
            role="progressbar"
            aria-label={t('blog.reading_progress')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ '--progress': `${progress}%` } as CSSProperties}
            className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5"
        >
            {/* The width is the tolerated dynamic CSS variable (same pattern as the valuation recap gauge). */}
            <span className="bg-primary block h-full w-(--progress) transition-[width] duration-150 ease-out motion-reduce:transition-none" />
        </div>
    );
}
