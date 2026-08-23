import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { type ReactNode } from 'react';

type Entry = { key: 'phone' | 'email' | 'address' | 'hours'; icon: ReactNode; label: string; value: ReactNode; href?: string };

const valueClass = 'text-foreground text-sm font-medium';

/** One row: icon on a soft sand disc (no border, darkens on hover), accessible label, value. */
function Row({ entry }: { entry: Entry }) {
    return (
        <li className="group flex items-center gap-3">
            <span
                aria-hidden
                className="bg-background-05 text-foreground group-hover:bg-secondary-40 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 [&_svg]:size-4"
            >
                {entry.icon}
            </span>
            <span className="sr-only">{entry.label}</span>
            {entry.href ? (
                <a
                    href={entry.href}
                    className={cn(valueClass, 'focus-ring hover:text-primary-40 rounded-sm transition-colors', entry.key === 'email' && 'break-all')}
                >
                    {entry.value}
                </a>
            ) : entry.key === 'address' ? (
                <address className={cn(valueClass, 'not-italic')}>{entry.value}</address>
            ) : (
                <span className={valueClass}>{entry.value}</span>
            )}
        </li>
    );
}

/** Phone / email / address from config/seo.php (shared `seo.organization`); rows without data are skipped. */
export default function ContactList() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const { phone, email, address } = seo.organization;
    const hours = seo.hours?.label;
    const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');

    const entries: Entry[] = [
        phone && { key: 'phone' as const, icon: <Phone />, label: t('footer.call'), value: phone, href: `tel:${phone.replace(/\s+/g, '')}` },
        email && { key: 'email' as const, icon: <Mail />, label: t('footer.email'), value: email, href: `mailto:${email}` },
        (address.street || cityLine) && {
            key: 'address' as const,
            icon: <MapPin />,
            label: t('footer.address'),
            value: (
                <>
                    {address.street}
                    {address.street && cityLine && <br />}
                    {cityLine}
                </>
            ),
        },
        hours && { key: 'hours' as const, icon: <Clock />, label: t('footer.hours'), value: hours },
    ].filter(Boolean) as Entry[];

    return (
        <ul className="flex flex-col gap-3">
            {entries.map((e) => (
                <Row key={e.key} entry={e} />
            ))}
        </ul>
    );
}
