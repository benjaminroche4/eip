/** Scrolls to and focuses a form control by id — a radio group / select gets its first focusable child. */
export function focusField(id: string): void {
    const element = document.getElementById(id);
    if (!element) return;
    const target = element.matches('input, textarea, select, button, [tabindex]')
        ? element
        : element.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]');
    (target ?? element).scrollIntoView({ block: 'center', behavior: 'smooth' });
    (target ?? element).focus({ preventScroll: true });
}
