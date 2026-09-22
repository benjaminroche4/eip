import { type EstimateErrors } from '@/components/estimate/types';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { CircleAlert } from 'lucide-react';

type EstimateErrorSummaryProps = {
    /** Fields in error, in page order. Renders nothing when empty. */
    fields: string[];
    errors: EstimateErrors;
};

/** Error summary at the top of the form: count + one link per field, focused on arrival (the form focuses the first field). */
export default function EstimateErrorSummary({ fields, errors }: EstimateErrorSummaryProps) {
    const { tc } = useTranslation();
    if (fields.length === 0) return null;

    return (
        <div role="alert" tabIndex={-1} className="border-destructive/30 bg-destructive/5 mb-9 flex flex-col gap-2 border p-4">
            <p className="text-destructive flex items-center gap-2 text-sm font-medium">
                <CircleAlert aria-hidden className="size-4 shrink-0" />
                {tc('estimate.errors_title', fields.length)}
            </p>
            <ul role="list" className="flex flex-col gap-1 pl-6 text-sm">
                {fields.map((field) => (
                    <li key={field}>
                        <a
                            href={`#${field}`}
                            onClick={(e) => {
                                e.preventDefault();
                                focusField(field);
                            }}
                            className="focus-ring underline underline-offset-2"
                        >
                            {errors[field]}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
