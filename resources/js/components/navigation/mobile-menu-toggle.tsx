import MenuToggleIcon from '@/components/navigation/menu-toggle-icon';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { forwardRef } from 'react';

type MobileMenuToggleProps = { open: boolean; controls: string; onToggle: () => void };

/** Hamburger (72×48, Figma 125-361) whose three hairlines morph into a cross when the menu is open. */
const MobileMenuToggle = forwardRef<HTMLButtonElement, MobileMenuToggleProps>(({ open, controls, onToggle }, ref) => {
    const { t } = useTranslation();

    return (
        <Button
            ref={ref}
            variant="ghost"
            aria-label={open ? t('nav.close_menu') : t('nav.open_menu')}
            aria-expanded={open}
            aria-controls={controls}
            onClick={onToggle}
            className="h-12 w-18 rounded-full hover:bg-transparent lg:hidden dark:hover:bg-transparent"
        >
            <MenuToggleIcon open={open} />
        </Button>
    );
});
MobileMenuToggle.displayName = 'MobileMenuToggle';

export default MobileMenuToggle;
