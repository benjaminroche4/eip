import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { type ComponentProps } from 'react';

type ResetButtonProps = {
    onClick: () => void;
    /** Defaults to « Réinitialiser »; the empty state says « Tout effacer ». */
    label?: string;
    size?: ComponentProps<typeof Button>['size'];
    className?: string;
};

/**
 * « Réinitialiser » of « Nos biens » (count row, filters modal at zero result, empty state): the site's outline button
 * with a counter-clockwise arrow that turns half a round on hover (ui.sh variant « Flèche qui tourne » chosen among 16,
 * user decision 2026-09-28; still in `motion-reduce`). Clears every criterion, the sort stays.
 */
export default function ResetButton({ onClick, label, size = 'sm', className }: ResetButtonProps) {
    const { t } = useTranslation();

    return (
        <Button type="button" variant="outline" size={size} onClick={onClick} className={cn('group', className)}>
            <RotateCcw aria-hidden className="transition-transform duration-500 group-hover:-rotate-180 motion-reduce:transition-none" />
            {label ?? t('properties.reset')}
        </Button>
    );
}
