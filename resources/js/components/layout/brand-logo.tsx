import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Brand logo from public/brand/*.svg — picks desktop/mobile by breakpoint
 * and dark/light variant by theme. "dark" files = dark artwork for light backgrounds.
 */
type BrandLogoProps = { className?: string; priority?: boolean };

export default function BrandLogo({ className, priority = false }: BrandLogoProps) {
    const { seo } = usePage<SharedData>().props;
    const fetchPriority = priority ? 'high' : 'auto';

    return (
        <span className={cn('inline-flex items-center', className)}>
            {/* Mobile */}
            <img
                src="/brand/logo_dark_mobile.svg"
                alt={seo.siteName}
                width={112}
                height={28}
                className="h-6.5 w-auto sm:hidden dark:hidden"
                fetchPriority={fetchPriority}
            />
            <img src="/brand/logo_light_mobile.svg" alt={seo.siteName} width={112} height={28} className="hidden h-6.5 w-auto sm:hidden dark:block" />
            {/* Desktop */}
            <img
                src="/brand/logo_dark_desktop.svg"
                alt={seo.siteName}
                width={213}
                height={24}
                className="hidden h-5.5 w-auto sm:block dark:sm:hidden"
                fetchPriority={fetchPriority}
            />
            <img src="/brand/logo_light_desktop.svg" alt={seo.siteName} width={213} height={24} className="hidden h-5.5 w-auto dark:sm:block" />
        </span>
    );
}
