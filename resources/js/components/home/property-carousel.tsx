import PageEyebrow from '@/components/page/page-eyebrow';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';

/** Placeholder listings until the property catalog exists — same photo everywhere, to replace with real data. */
const PROPERTIES = [
    { key: 1, image: '/images/home/property-1.jpg', offMarket: true },
    { key: 2, image: '/images/home/property-1.jpg', offMarket: false },
    { key: 3, image: '/images/home/property-1.jpg', offMarket: false },
    { key: 4, image: '/images/home/property-1.jpg', offMarket: true },
] as const;

/**
 * Selected properties on the home page (Figma 712-25186): grey full-bleed band, pitch + "view all" CTA on
 * the left, a one-slide carousel on the right — counter, pill arrow buttons, photo card with a dark bottom
 * gradient, off-market badge, title / meta / price. Square card corners and project type scale, as everywhere.
 */
export default function PropertyCarousel() {
    const { t } = useTranslation();
    const [index, setIndex] = useState(0);
    const property = PROPERTIES[index];

    const arrowClass =
        'focus-ring border-border hover:bg-background-05 flex h-12 w-18 items-center justify-center rounded-full border disabled:opacity-40 disabled:hover:bg-transparent';

    return (
        <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-3">
            {/* Full-bleed grey band behind the section (same trick as the newsletter backdrop) */}
            <div aria-hidden className="bg-grey-5 pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2" />
            <div className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-20">
                <div className="flex flex-col gap-8 lg:justify-between lg:pt-14">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                            <PageEyebrow>{t('home.properties_label')}</PageEyebrow>
                            <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">{t('home.properties_title')}</h2>
                        </div>
                        <p className="text-muted-foreground max-w-xl text-base/7 text-pretty sm:text-sm/6">{t('home.properties_intro')}</p>
                    </div>
                    <Button asChild size="lg" className="self-start">
                        <Link href={route('buy')} prefetch>
                            {t('home.properties_cta')}
                        </Link>
                    </Button>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex items-end justify-between">
                        <p className="text-sm tabular-nums">
                            <span className="text-foreground font-medium">{index + 1}</span>
                            <span className="text-muted-foreground">/{PROPERTIES.length}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                aria-label={t('home.properties_prev')}
                                disabled={index === 0}
                                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                                className={arrowClass}
                            >
                                <ArrowLeft aria-hidden className="size-5" />
                            </button>
                            <button
                                type="button"
                                aria-label={t('home.properties_next')}
                                disabled={index === PROPERTIES.length - 1}
                                onClick={() => setIndex((current) => Math.min(PROPERTIES.length - 1, current + 1))}
                                className={arrowClass}
                            >
                                <ArrowRight aria-hidden className="size-5" />
                            </button>
                        </div>
                    </div>
                    <div aria-live="polite" className="relative h-100 overflow-hidden rounded-none">
                        <SeoImage
                            src={property.image}
                            alt={t(`home.properties_${property.key}_title`)}
                            width={1200}
                            height={800}
                            sizes="(min-width: 64rem) 50vw, 100vw"
                            className="absolute inset-0 size-full object-cover"
                        />
                        {/* Legibility gradient over the photo's lower half */}
                        <div aria-hidden className="absolute inset-0 bg-linear-to-b from-black/0 from-50% to-black/90" />
                        <div className="relative flex h-full flex-col items-start justify-between p-6 text-white sm:p-7">
                            {property.offMarket && (
                                <p className="flex items-center gap-2 text-sm tracking-wide uppercase">
                                    <span aria-hidden className="size-1.5 rounded-full bg-white" />
                                    {t('home.properties_offmarket')}
                                </p>
                            )}
                            <div className="mt-auto flex w-full items-end justify-between gap-6">
                                <div className="flex min-w-0 flex-col gap-1">
                                    <p className="font-heading text-xl font-medium">{t(`home.properties_${property.key}_title`)}</p>
                                    <p className="text-sm text-white/75">{t(`home.properties_${property.key}_meta`)}</p>
                                </div>
                                <p className="font-heading flex shrink-0 items-center gap-3 font-medium">
                                    <span aria-hidden className="h-4 w-px bg-white/50" />
                                    {t(`home.properties_${property.key}_price`)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
