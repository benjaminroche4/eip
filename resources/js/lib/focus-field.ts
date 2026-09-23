/** `smooth` unless the reader asked for reduced motion (then the jump is instant). */
export function scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/** Scrolls to and focuses a form control by id — a radio group / select gets its first focusable child. */
export function focusField(id: string): void {
    const element = document.getElementById(id);
    if (!element) return;
    const target = element.matches('input, textarea, select, button, [tabindex]')
        ? element
        : element.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]');
    (target ?? element).scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    (target ?? element).focus({ preventScroll: true });
}
