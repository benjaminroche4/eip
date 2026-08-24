import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

const NETWORKS = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'instagram', label: 'Instagram' },
] as const;

type SocialLinksProps = { className?: string };

/** 36px outlined discs, filled Primary on hover/focus (white glyph inverted to dark at rest). 14px glyphs from public/images/social. Only configured networks render. */
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
                        aria-label={`${n.label} ${t('footer.new_tab')}`}
                        className="group ring-border hover:bg-primary hover:ring-primary focus-visible:bg-primary focus-visible:ring-primary focus-ring flex size-9 items-center justify-center rounded-full bg-transparent ring-1 transition-[background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none"
                    >
                        <img
                            src={`/images/social/${n.key}.svg`}
                            alt=""
                            width={14}
                            height={14}
                            className="size-3.5 invert transition-[filter] duration-300 group-hover:invert-0 group-focus-visible:invert-0 motion-reduce:transition-none"
                        />
                    </a>
                </li>
            ))}
        </ul>
    );
}
