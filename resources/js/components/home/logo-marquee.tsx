import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

/**
 * Partner / press logos. Drop white SVG files in public/images/logos and list them here
 * ({ name, src, width, height }). The logo-0x.svg files are neutral placeholders to replace.
 */
const LOGOS: { name: string; src?: string; width?: number; height?: number }[] = [
    { name: 'Atelier', src: '/images/logos/logo-01.svg', width: 120, height: 28 },
    { name: 'Maison', src: '/images/logos/logo-02.svg', width: 118, height: 28 },
    { name: 'Héritage', src: '/images/logos/logo-03.svg', width: 140, height: 28 },
    { name: 'Lumière', src: '/images/logos/logo-04.svg', width: 80, height: 28 },
    { name: 'Privé', src: '/images/logos/logo-05.svg', width: 100, height: 28 },
];

type LogoMarqueeProps = { className?: string };

/** Infinite, seamless logo strip: list rendered twice, translated by -50 %. Mobile: light fade on both edges; desktop: left fade behind a hairline. */
export default function LogoMarquee({ className }: LogoMarqueeProps) {
    const { t } = useTranslation();

    return (
        <div aria-label={t('home.logos_label')} className={cn('relative flex items-center opacity-70', className)}>
            {/* Hairline divider: logos fade out and vanish behind it */}
            <span aria-hidden className="absolute inset-y-0 left-0 z-10 my-auto hidden h-6 w-px bg-white/40 lg:block" />
            <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:[mask-image:none] lg:pl-px lg:[mask-image:linear-gradient(to_right,transparent,black_35%,black)]">
                <ul className="animate-marquee flex w-max items-center gap-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
                    {[...LOGOS, ...LOGOS].map((logo, i) => (
                        <li key={`${logo.name}-${i}`} aria-hidden={i >= LOGOS.length} className="shrink-0">
                            {logo.src ? (
                                <img
                                    src={logo.src}
                                    alt={logo.name}
                                    width={logo.width}
                                    height={logo.height}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-5 w-auto"
                                />
                            ) : (
                                <span className="font-heading text-sm font-medium tracking-widest whitespace-nowrap text-white uppercase">
                                    {logo.name}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
