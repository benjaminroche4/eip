import { hoverActiveClass, hoverSurfaceClass } from '@/lib/hover-surface';
import { cn } from '@/lib/utils';
import { type InertiaLinkProps, Link } from '@inertiajs/react';
import { forwardRef } from 'react';

type NavLinkProps = Omit<InertiaLinkProps, 'size'> & {
    active?: boolean;
    size?: 'md' | 'lg';
    /** No drawn-underline hover (mobile menu): active = sand background. */ plain?: boolean;
};

/** Header / menu link: Montserrat, 40px (md, 14px text) or 44px (lg, 16px text), drawn-underline hover (or a plain sand surface when `plain`), visible keyboard focus ring. */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ active = false, size = 'md', plain = false, className, children, ...props }, ref) => (
    <Link
        ref={ref}
        prefetch
        aria-current={active ? 'page' : undefined}
        className={cn(
            'group font-heading text-foreground focus-ring flex items-center gap-3 rounded-none p-2 text-sm font-normal',
            size === 'md' ? 'h-10' : 'h-11 w-full text-base',
            plain ? 'hover:bg-background-05 transition-colors motion-reduce:transition-none' : hoverSurfaceClass,
            active && (plain ? 'bg-background-08' : hoverActiveClass),
            className,
        )}
        {...props}
    >
        {children}
    </Link>
));
NavLink.displayName = 'NavLink';

export default NavLink;
