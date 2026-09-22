import SeoImage from '@/components/seo/seo-image';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/** Alt texts of the four photos (`sell.gallery`, FR + EN), in the order of `public/images/sell/gallery-{1..4}-{800,1600}.jpg`. */
type SellGalleryProps = { alts: string[] };

/**
 * Photo mosaic of the « Vendre » page (2026-09-22), under the wide photo: four bare photos with square corners and no
 * frame in a `grid-cols-2` on mobile (each 3/2), and on desktop a three-column mosaic where the first photo spans two
 * columns and two rows (the three others stack beside it). Nothing interactive, photos lazy (the wide photo above
 * is the LCP). `public/images/sell/gallery-*.jpg` = the Figma district exports (placeholders to replace by sold listings).
 */
export default function SellGallery({ alts }: SellGalleryProps) {
    const { t } = useTranslation();

    return (
        <section aria-label={t('sell.gallery_label')}>
            <ul role="list" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
                {alts.map((alt, i) => (
                    <li key={i} className={cn('relative overflow-hidden', i === 0 && 'col-span-2 lg:row-span-2')}>
                        <SeoImage
                            src={`/images/sell/gallery-${i + 1}-1600.jpg`}
                            srcSet={`/images/sell/gallery-${i + 1}-800.jpg 800w, /images/sell/gallery-${i + 1}-1600.jpg 1600w`}
                            sizes={
                                i === 0
                                    ? '(min-width: 80rem) 50rem, (min-width: 64rem) 66vw, 100vw'
                                    : '(min-width: 80rem) 25rem, (min-width: 64rem) 33vw, 50vw'
                            }
                            alt={alt}
                            width={1600}
                            height={1067}
                            className={cn('size-full object-cover', i === 0 ? 'aspect-[3/2] lg:aspect-auto' : 'aspect-[3/2]')}
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
