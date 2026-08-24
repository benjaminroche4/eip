import LogoMarquee from '@/components/home/logo-marquee';
import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

/**
 * Home hero (Figma 123-304): full-bleed photo (square corners), 40 % dark veil + bottom-up
 * black gradient, two-line Montserrat medium headline bottom-left and a neutral (white) CTA.
 * Sizes follow Tailwind's scale and shadcn variants rather than the Figma pixels.
 */
/** Word-by-word "decipher" reveal (see --animate-unblur in app.css), ~150ms stagger per word. */
const wordDelays = ['delay-150', 'delay-300', 'delay-500', 'delay-700', 'delay-1000', 'delay-1000', 'delay-1000'];

/** CTA row: fades and rises after the headline. */
const ctaReveal =
    'animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-700 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none';

export default function Hero() {
    const { t } = useTranslation();

    return (
        <section
            aria-labelledby="hero-title"
            className="animate-in fade-in relative flex min-h-160 flex-col justify-between overflow-hidden text-white duration-1000 motion-reduce:animate-none"
        >
            <SeoImage
                priority
                src="/images/home/hero-1200.jpg"
                srcSet="/images/home/hero-800.jpg 800w, /images/home/hero-1200.jpg 1200w, /images/home/hero-2000.jpg 2000w"
                sizes="(min-width: 80rem) 1240px, 100vw"
                alt=""
                width={2000}
                height={1333}
                className="animate-in zoom-in-110 fill-mode-both absolute inset-0 size-full object-cover duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none"
            />
            <div aria-hidden className="absolute inset-0 bg-black/40" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/0 via-30% to-transparent" />
            {/* Passe-partout: hairline inset 12px */}
            <div aria-hidden className="pointer-events-none absolute inset-3 border border-white/15" />

            <div className="relative p-8 pb-0 sm:p-10 sm:pb-0 lg:p-12 lg:pb-0">
                <p className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex items-center gap-2 text-xs font-semibold text-white/90 duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none">
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
                    {[t('home.hero_title_1'), t('home.hero_title_2')].map((line, lineIndex) => (
                        <span key={line} className="block">
                            {line.split(' ').map((word, wordIndex) => {
                                const index = lineIndex * 3 + wordIndex;
                                return (
                                    <Fragment key={`${word}-${wordIndex}`}>
                                        {wordIndex > 0 && ' '}
                                        <span
                                            className={cn(
                                                'animate-unblur inline-block motion-reduce:animate-none',
                                                wordDelays[Math.min(index, wordDelays.length - 1)],
                                            )}
                                        >
                                            {word}
                                        </span>
                                    </Fragment>
                                );
                            })}
                        </span>
                    ))}
                </h1>
                <div className={cn(ctaReveal, 'flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between')}>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Button asChild variant="neutral" size="lg" className="w-full sm:w-auto">
                            <Link href="#">{t('home.hero_cta')}</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white sm:w-auto"
                        >
                            <Link href="#">{t('nav.estimate')}</Link>
                        </Button>
                    </div>
                    <LogoMarquee className="w-full pt-6 lg:w-1/3 lg:pt-0" />
                </div>
            </div>
        </section>
    );
}
