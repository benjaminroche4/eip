import { type NavItem } from '@/components/navigation/nav-items';
import { Link } from '@inertiajs/react';

/** Inter 14 links with the animated underline used across the site — the same entries as the header. */
export default function FooterNav({ items, label }: { items: NavItem[]; label: string }) {
    return (
        <nav aria-label={label}>
            <ul className="flex flex-col gap-2">
                {items.map((item) => (
                    <li key={item.key}>
                        <Link
                            href={item.href}
                            prefetch
                            className="text-foreground focus-ring hover:text-primary-40 rounded-sm text-sm transition-colors"
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
