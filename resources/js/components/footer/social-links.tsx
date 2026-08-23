import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const NETWORKS = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'threads', label: 'Threads' },
    { key: 'facebook', label: 'Facebook' },
] as const;

type SocialLinksProps = { className?: string };

/** 24px Primary discs with 12px white glyphs (public/images/social), lighter on hover. Only configured networks render. */
export default function SocialLinks({ className }: SocialLinksProps) {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const networks = NETWORKS.filter((n) => seo.social[n.key]);

    if (networks.length === 0) return null;

    return (
        <ul aria-label={t('footer.follow')} className={cn('flex items-center gap-2', className)}>
            {networks.map((n) => (
                <li key={n.key}>
                    <a
                        href={seo.social[n.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={n.label}
                        className="bg-primary hover:bg-primary-50 focus-ring flex size-6 items-center justify-center rounded-full transition-colors duration-300"
                    >
                        <img src={`/images/social/${n.key}.svg`} alt="" width={12} height={12} className="size-3" />
                    </a>
                </li>
            ))}
        </ul>
    );
}
