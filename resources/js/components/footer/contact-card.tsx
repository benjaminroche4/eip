import { useContactHref } from '@/components/navigation/nav-items';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

/** Advisor portraits from public/images/advisors/advisor-{1,2,3}.webp; initials are the fallback while loading. */
const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

/**
 * Contact block (the whole block links to the contact page): the availability sentence,
 * then one row — small overlapping advisor avatars | hairline | phone number.
 */
export default function ContactCard() {
    const { seo } = usePage<SharedData>().props;
    const { t } = useTranslation();
    const href = useContactHref();
    const { phone } = seo.organization;

    if (!phone) return null;

    return (
        <Link href={href} prefetch className="group focus-ring flex flex-col gap-3 rounded-sm">
            <p className="text-foreground text-sm">{t('footer.intro')}</p>

            <div className="flex items-center gap-3">
                <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-2">
                    {ADVISORS.map((a) => (
                        <li key={a.id}>
                            <Avatar className="ring-background-05 size-8 ring-2">
                                <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                            </Avatar>
                        </li>
                    ))}
                </ul>
                <span aria-hidden className="bg-border h-6 w-px" />
                <p
                    className={cn(
                        'text-foreground relative text-base font-medium tabular-nums',
                        // same drawn underline as the nav links, driven by the whole block's hover/focus
                        'after:bg-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-right after:scale-x-0 after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:after:origin-left group-hover:after:scale-x-100 group-focus-visible:after:origin-left group-focus-visible:after:scale-x-100 motion-reduce:after:transition-none',
                    )}
                >
                    {phone}
                </p>
            </div>
        </Link>
    );
}
