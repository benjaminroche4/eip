import { hoverActiveClass, hoverSurfaceClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { type InertiaLinkProps, Link } from '@inertiajs/react';
import { forwardRef } from 'react';

type NavLinkProps = Omit<InertiaLinkProps, 'size'> & { active?: boolean; size?: 'md' | 'lg' };

/** Header / menu link: Montserrat, 40px (md, 14px text) or 44px (lg, 16px text), ellipse hover surface, visible keyboard focus ring. */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ active = false, size = 'md', className, children, ...props }, ref) => (
    <Link
        ref={ref}
        prefetch
        aria-current={active ? 'page' : undefined}
        className={cn(
            'font-heading text-foreground focus-ring flex items-center gap-3 rounded-none p-2 text-sm font-normal',
            size === 'md' ? 'h-10' : 'h-11 w-full text-base',
            hoverSurfaceClass,
            active && hoverActiveClass,
            className,
        )}
        {...props}
    >
        {children}
    </Link>
));
NavLink.displayName = 'NavLink';

export default NavLink;
