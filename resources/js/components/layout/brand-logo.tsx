import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Brand logo from public/brand/*.svg — picks desktop/mobile by breakpoint
 * and dark/light variant by theme. "dark" files = dark artwork for light backgrounds.
 * `light`: forces the light (white) artwork below `lg`, whatever the theme — the home header floating transparent
 * over the hero on mobile (user decision 2026-09-25); desktop keeps the theme's variant.
 */
type BrandLogoProps = { className?: string; priority?: boolean; light?: boolean };

export default function BrandLogo({ className, priority = false, light = false }: BrandLogoProps) {
    const { seo } = usePage<SharedData>().props;
    // The visible variant gets the priority (Lighthouse 2026-10-12: the light mobile logo was the LCP of the home, lazy and unprioritised)
    const dark = { fetchPriority: priority && !light ? ('high' as const) : ('auto' as const), loading: light ? ('lazy' as const) : undefined };
    const lightImg = { fetchPriority: priority && light ? ('high' as const) : ('auto' as const), loading: light ? undefined : ('lazy' as const) };

    return (
        <span className={cn('inline-flex items-center', className)}>
            {/* Mobile */}
            <img
                src="/brand/logo_dark_mobile.svg"
                alt={seo.siteName}
                width={112}
                height={28}
                className={cn('h-6.5 w-auto sm:hidden dark:hidden', light && 'hidden')}
                {...dark}
            />
            <img
                src="/brand/logo_light_mobile.svg"
                alt={seo.siteName}
                width={112}
                height={28}
                className={cn('hidden h-6.5 w-auto sm:hidden dark:block', light && 'block')}
                {...lightImg}
            />
            {/* Desktop */}
            <img
                src="/brand/logo_dark_desktop.svg"
                alt={seo.siteName}
                width={213}
                height={24}
                className={cn('hidden h-5.5 w-auto sm:block dark:sm:hidden', light && 'sm:max-lg:hidden')}
                {...dark}
            />
            <img
                src="/brand/logo_light_desktop.svg"
                alt={seo.siteName}
                width={213}
                height={24}
                className={cn('hidden h-5.5 w-auto dark:sm:block', light && 'sm:max-lg:block')}
                {...lightImg}
            />
        </span>
    );
}
