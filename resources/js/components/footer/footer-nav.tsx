import { type NavItem } from '@/components/navigation/nav-items';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import { hoverSurfaceClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

/** Inter 14 links with the same drawn-underline hover as the header — the same entries as the header. */
export default function FooterNav({ items, label }: { items: NavItem[]; label: string }) {
    const { t } = useTranslation();
    const linkClass = cn('text-foreground focus-ring inline-flex items-center gap-2 rounded-none px-2 py-1 text-sm', hoverSurfaceClass);
    return (
        <nav aria-label={label}>
            <ul className="-mx-2 flex flex-col items-start gap-1">
                {items.map((item) => (
                    <li key={item.key}>
                        {item.external ? (
                            /* Another site (Relocation in Paris): plain link, new tab, announced to screen readers */
                            <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                {item.label}
                                <ArrowUpRight aria-hidden className="text-muted-foreground size-3.5" />
                                <span className="sr-only">{t('footer.new_tab')}</span>
                            </a>
                        ) : (
                            <Link href={item.href} prefetch className={linkClass}>
                                {item.label}
                                {item.badge && (
                                    <Badge
                                        variant="outline"
                                        className="border-border text-muted-foreground bg-transparent px-1.5 py-0 text-xs font-medium"
                                    >
                                        {item.badge}
                                    </Badge>
                                )}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
