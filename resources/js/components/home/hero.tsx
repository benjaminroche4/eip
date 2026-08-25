import LogoMarquee from '@/components/home/logo-marquee';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';

/**
 * Home hero (Figma 123-304): full-bleed photo (square corners), 40 % dark veil + bottom-up
 * black gradient, two-line Montserrat medium headline bottom-left and a neutral (white) CTA.
 * Sizes follow Tailwind's scale and shadcn variants rather than the Figma pixels.
 */
export default function Hero() {
    const { t } = useTranslation();

    return (
        <section aria-labelledby="hero-title" className="relative flex min-h-160 flex-col justify-between overflow-hidden text-white">
            <SeoImage
                priority
                src="/images/home/hero-1200.jpg"
                srcSet="/images/home/hero-800.jpg 800w, /images/home/hero-1200.jpg 1200w, /images/home/hero-2000.jpg 2000w"
                sizes="(min-width: 80rem) 1240px, 100vw"
                alt=""
                width={2000}
                height={1333}
                className="absolute inset-0 size-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-black/40" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/0 via-30% to-transparent" />
            {/* Passe-partout: hairline inset 12px */}
            <div aria-hidden className="pointer-events-none absolute inset-3 border border-white/15" />

            <div className="relative p-8 pb-0 sm:p-10 sm:pb-0 lg:p-12 lg:pb-0">
                <p className="flex items-center gap-2 text-xs font-semibold text-white/90">
                    <img
                        src="/images/laurel-left.svg"
                        alt=""
                        aria-hidden
                        width={24}
                        height={43}
                        className="h-8 w-auto shrink-0 -scale-y-100 rotate-180"
                    />
                    <span className="text-center leading-snug whitespace-pre-line">{t('home.hero_trust')}</span>
                    <img src="/images/laurel-right.svg" alt="" aria-hidden width={24} height={43} className="h-8 w-auto shrink-0" />
                </p>
            </div>

            <div className="relative flex w-full flex-col items-start gap-6 p-8 sm:p-10 lg:p-12">
                <h1 id="hero-title" className="font-heading text-3xl leading-none font-medium text-balance sm:text-4xl lg:text-5xl">
                    {[t('home.hero_title_1'), t('home.hero_title_2')].map((line) => (
                        <span key={line} className="block">
                            {line}
                        </span>
                    ))}
                </h1>
                <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button asChild variant="neutral" size="lg" className="w-full sm:w-auto">
                            <Link href={route('contact')} prefetch>
                                {t('home.hero_cta')}
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white sm:w-auto"
                        >
                            <Link href={route('estimate')} prefetch>
                                {t('nav.estimate')}
                            </Link>
                        </Button>
                    </div>
                    <LogoMarquee className="w-full pt-6 lg:w-1/3 lg:pt-0" />
                </div>
            </div>
        </section>
    );
}
