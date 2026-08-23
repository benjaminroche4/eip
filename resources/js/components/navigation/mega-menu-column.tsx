import NavLink from '@/components/navigation/nav-link';
import { cn } from '@/lib/utils';

export type MegaLink = { label: string; href: string };
export type MegaColumn = { title: string; links: MegaLink[] };

/** Titled list of links used by the desktop mega menu and the mobile sheet. */
export default function MegaMenuColumn({ column, onNavigate, className }: { column: MegaColumn; onNavigate?: () => void; className?: string }) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <p className="font-heading text-foreground px-2 text-base font-semibold">{column.title}</p>
            <ul className="flex flex-col">
                {column.links.map((link) => (
                    <li key={link.label}>
                        <NavLink href={link.href} size="lg" onClick={onNavigate}>
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}
