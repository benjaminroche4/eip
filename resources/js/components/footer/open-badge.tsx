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
            className="border-border text-muted-foreground gap-1.5 bg-transparent py-0 pr-2 pl-1.5 text-[0.6875rem] font-medium"
            title={seo.hours.label}
        >
            {/* Green status dot (user decision 2026-09-15); the word « Ouvert » carries the meaning, the colour is a reinforcement. */}
            <span aria-hidden className="bg-success size-1.5 shrink-0 rounded-full" />
            {t('footer.open_now')}
        </Badge>
    );
}
