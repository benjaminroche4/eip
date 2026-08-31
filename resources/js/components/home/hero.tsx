import SeoImage from '@/components/seo/seo-image';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Link } from '@inertiajs/react';
import { type LucideIcon, MapPin, ShieldCheck, UserCheck } from 'lucide-react';

/** The three commitments shown at the bottom of the hero (Figma 712-25088), icons matched to our labels. */
const VALUES: { key: 'value_1' | 'value_2' | 'value_3'; icon: LucideIcon }[] = [
    { key: 'value_1', icon: ShieldCheck },
    { key: 'value_2', icon: MapPin },
    { key: 'value_3', icon: UserCheck },
];

/**
 * Home hero (Figma 123-304, values row 712-25088): full-bleed photo (square corners), 40 % dark veil +
 * bottom-up black gradient, balanced Montserrat medium headline, CTAs and the three commitments all on the
 * same left edge (small text, gradient hairline separators). No inner frame, no search bar, no carousel —
 * refinement variants were compared and the current design confirmed (user decision 2026-08-31).
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
                <h1 id="hero-title" className="font-heading max-w-3xl text-3xl font-medium text-balance sm:text-4xl lg:text-5xl">
                    {`${t('home.hero_title_1')} ${t('home.hero_title_2')}`}
                </h1>
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

                {/* The three commitments (Figma 712-25088): left-aligned on the same edge as the headline and
                    CTAs, stacked full-width on mobile — no carousel */}
                <ul
                    role="list"
                    aria-label={t('home.values_label')}
                    className="flex w-full flex-col gap-3 pt-4 text-white/90 sm:flex-row sm:items-center sm:gap-6 lg:gap-8"
                >
                    {VALUES.map(({ key, icon: Icon }, index) => (
                        <li key={key} className="flex items-center gap-3 sm:gap-6 lg:gap-8">
                            {index > 0 && (
                                <span
                                    aria-hidden
                                    className="hidden h-6 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent sm:block"
                                />
                            )}
                            <span className="flex items-center gap-2.5">
                                <Icon aria-hidden className="size-4 shrink-0" />
                                <span className="text-sm">{t(`home.${key}`)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
