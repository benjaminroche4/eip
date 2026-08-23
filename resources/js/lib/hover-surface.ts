/**
 * "Premium" hover: a 1px hairline draws from left to right (transform-origin left); on leave it exits
 * to the right (origin flips) — the classic editorial underline. No background, text never moves or
 * changes weight. Motion disabled for prefers-reduced-motion.
 */
const easeExpo = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

export const hoverSurfaceClass = [
    'relative',
    'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-1 after:h-px after:bg-foreground',
    'after:origin-right after:scale-x-0 after:transition-transform after:duration-500',
    `after:${easeExpo}`,
    'hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100',
    'motion-reduce:after:transition-none',
].join(' ');

/** Forces the drawn state (active / open items). */
export const hoverActiveClass = 'after:origin-left after:scale-x-100';

/** Shared easing for panels / cascades. */
export const premiumEase = easeExpo;
