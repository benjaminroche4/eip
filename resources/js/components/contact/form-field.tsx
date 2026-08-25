import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { type ReactNode } from 'react';

type FormFieldProps = {
    id: string;
    label: string;
    error?: string;
    required?: boolean;
    /** Renders the control; receives the ARIA wiring to spread on it. */
    children: (aria: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; 'aria-required': boolean }) => ReactNode;
};

/** Label + control + inline error (Figma 67-7996): the asterisk is decorative, `required` is carried by ARIA. */
export default function FormField({ id, label, error, required = false, children }: FormFieldProps) {
    const { t } = useTranslation();
    const errorId = `${id}-error`;

    return (
        <div className="flex w-full flex-col gap-2">
            <Label htmlFor={id} className="gap-0.5">
                {label}
                {required && (
                    <>
                        <span aria-hidden className="text-destructive">
                            *
                        </span>
                        <span className="sr-only"> ({t('contact.required')})</span>
                    </>
                )}
            </Label>
            {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined, 'aria-required': required })}
            {error && (
                <p id={errorId} className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </div>
    );
}
