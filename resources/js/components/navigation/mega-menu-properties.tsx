import MegaMenuColumn, { type MegaColumn } from '@/components/navigation/mega-menu-column';
import MegaMenuPromo from '@/components/navigation/mega-menu-promo';
import { useTranslation } from '@/hooks/use-translation';
import { premiumEase } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';

const BROWSE_KEYS = ['all', 'apartments', 'houses', 'off_market'] as const;
const LOCATION_KEYS = ['marais', 'saint_germain', 'seventh', 'sixteenth'] as const;

/** Columns of the "Our Properties" mega menu. Hrefs are "#" until the listing pages exist. */
export function usePropertiesMenu(): MegaColumn[] {
    const { t } = useTranslation();
    return [
        {
            title: t('nav.mega.browse'),
            links: BROWSE_KEYS.map((k) => ({ label: t(`nav.mega.browse_items.${k}`), href: k === 'all' ? route('search') : '#' })),
        },
        { title: t('nav.mega.locations'), links: LOCATION_KEYS.map((k) => ({ label: t(`nav.mega.location_items.${k}`), href: '#' })) },
    ];
}

/** Children cascade in (fade + 8px rise) once the parent `group/mega` is open; delay set per item. */
const cascadeClass = cn(
    'translate-y-2 opacity-0 transition-[opacity,transform] duration-500 motion-reduce:transition-none',
    premiumEase,
    'group-data-[open=true]/mega:translate-y-0 group-data-[open=true]/mega:opacity-100',
);
const cascadeDelay = ['delay-75', 'delay-150', 'delay-200'] as const;

/** Desktop panel: two 340px columns + promo card (Figma 137-3488). */
export default function MegaMenuProperties({ columns, onNavigate }: { columns: MegaColumn[]; onNavigate?: () => void }) {
    const { t } = useTranslation();

    return (
        <div className="bg-card text-card-foreground ring-border/60 shadow-primary-100/10 flex items-start gap-2.5 rounded-lg p-3 shadow-xl ring-1">
            <div className="flex gap-5 p-3">
                {columns.map((column, i) => (
                    <MegaMenuColumn
                        key={column.title}
                        column={column}
                        onNavigate={onNavigate}
                        className={cn('w-85 p-3', cascadeClass, cascadeDelay[i])}
                    />
                ))}
            </div>
            <MegaMenuPromo
                className={cn('min-w-px flex-1 self-stretch', cascadeClass, cascadeDelay[2])}
                title={t('nav.mega.promo_title')}
                text={t('nav.mega.promo_text')}
                cta={{ label: t('nav.mega.promo_cta'), href: '#' }}
                image={{ src: '/images/menu-exclusive-collection.jpg', width: 1280, height: 853 }}
                onNavigate={onNavigate}
            />
        </div>
    );
}
