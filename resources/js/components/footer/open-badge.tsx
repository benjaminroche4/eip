import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/** "Open" pill shown only during opening hours (computed server-side in Paris time, so SSR and client agree). */
export default function OpenBadge() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();

    if (!seo.hours.open) return null;

    return (
        <Badge
            variant="outline"
            className="border-border text-muted-foreground bg-transparent px-2 py-0 text-[0.6875rem] font-medium"
            title={seo.hours.label}
        >
            {t('footer.open_now')}
        </Badge>
    );
}
