import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type ContactDetailProps = {
    icon: LucideIcon;
    /** Screen-reader name of the item ("Call us"…) — visually the icon + value speak for themselves. */
    label: string;
    children: ReactNode;
};

/** One way to reach the agency: icon in a soft round chip, then the value(s) beside it. */
export default function ContactDetail({ icon: Icon, label, children }: ContactDetailProps) {
    return (
        <div className="flex items-start gap-4">
            <span aria-hidden className="bg-background-05 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4" />
            </span>
            <div className="flex flex-col gap-1.5 text-base/7 sm:text-sm/6">
                <span className="sr-only">{label}</span>
                {children}
            </div>
        </div>
    );
}
