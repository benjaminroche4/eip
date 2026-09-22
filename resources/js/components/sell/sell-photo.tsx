import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';

/**
 * Photo section of the « Vendre » page (2026-09-22): one wide photo, no frame, square corners, edge to edge on mobile
 * (`-mx-6`) in 16/9 and 21/9 from `lg`, with the site's entry zoom (`animate-hero-photo`, `motion-reduce` cancels) —
 * the same panel as the « Acheter » hero. `public/images/sell/photo-{800,1600}.jpg` = the Figma export « interior
 * with Eiffel Tower view » (placeholder to replace by a real listing).
 */
export default function SellPhoto() {
    const { t } = useTranslation();

    return (
        <section aria-label={t('sell.photo_alt')} className="relative -mx-6 aspect-video overflow-hidden lg:mx-0 lg:aspect-[21/9]">
            <SeoImage
                src="/images/sell/photo-1600.jpg"
                srcSet="/images/sell/photo-800.jpg 800w, /images/sell/photo-1600.jpg 1600w"
                sizes="(min-width: 80rem) 76rem, 100vw"
                alt={t('sell.photo_alt')}
                width={1600}
                height={630}
                priority
                className="animate-hero-photo absolute inset-0 size-full object-cover motion-reduce:animate-none"
            />
        </section>
    );
}
