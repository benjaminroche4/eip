import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

/**
 * The site has a single visual: light, whatever the OS preference (user decision).
 * The `.dark` class is never applied; the starter-kit appearance UI (private area) is kept but inert.
 */
const applyTheme = () => {
    document.documentElement.classList.remove('dark');
};

export function initializeTheme() {
    applyTheme();
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        localStorage.setItem('appearance', mode);
        applyTheme();
    };

    useEffect(() => {
        applyTheme();
    }, []);

    return { appearance, updateAppearance };
}
