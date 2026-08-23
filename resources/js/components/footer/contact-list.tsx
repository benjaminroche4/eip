import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/** Contact column: one plain sentence with the phone number, no links (per design). Phone from config/seo.php. */
export default function ContactList() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { phone } = seo.organization;

    if (!phone) return null;

    return <p className="text-foreground text-sm">{t('footer.intro', { phone })}</p>;
}
