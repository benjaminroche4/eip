import { type NavItem } from '@/components/navigation/nav-items';
import { Badge } from '@/components/ui/badge';
import { hoverSurfaceClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

/** Inter 14 links with the same drawn-underline hover as the header — the same entries as the header. */
export default function FooterNav({ items, label }: { items: NavItem[]; label: string }) {
    return (
        <nav aria-label={label}>
            <ul className="-mx-2 flex flex-col items-start gap-1">
                {items.map((item) => (
                    <li key={item.key}>
                        <Link
                            href={item.href}
                            prefetch
                            className={cn(
                                'text-foreground focus-ring inline-flex items-center gap-2 rounded-sm px-2 py-1 text-sm',
                                hoverSurfaceClass,
                            )}
                        >
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
                    </li>
                ))}
            </ul>
        </nav>
    );
}
