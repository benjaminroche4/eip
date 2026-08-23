import LanguageSwitcher from '@/components/i18n/language-switcher';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('LanguageSwitcher', () => {
    it('opens with the keyboard and exposes crawlable hreflang links to each locale', async () => {
        const user = userEvent.setup();
        renderPage(<LanguageSwitcher />);

        const trigger = screen.getByRole('button', { name: 'Langue' });
        trigger.focus();
        await user.keyboard('{Enter}');

        const en = await screen.findByRole('menuitem', { name: /English/ });
        expect(en).toHaveAttribute('href', 'http://localhost/en');
        expect(en).toHaveAttribute('hreflang', 'en');
        expect(en).toHaveAttribute('lang', 'en');
        expect(screen.getByRole('menuitem', { name: /Français/ })).toHaveAttribute('aria-current', 'page');

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it('has no axe violations', async () => {
        const { container } = renderPage(<LanguageSwitcher />);
        expect(await axe(container)).toHaveNoViolations();
    });
});
