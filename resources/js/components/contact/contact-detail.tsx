import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

type ContactDetailProps = {
    icon: LucideIcon;
    label: string;
    children: ReactNode;
};

/** One way to reach the agency (Figma 261-7361): "icon | label" eyebrow, then the value(s). */
export default function ContactDetail({ icon: Icon, label, children }: ContactDetailProps) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-muted-foreground flex items-center gap-2 font-sans text-base/7 font-normal sm:text-sm/6">
                <Icon aria-hidden className="size-5 shrink-0" />
                <span aria-hidden className="bg-border h-4 w-px" />
                {label}
            </h2>
            <div className="flex flex-col gap-1.5 text-base/7 sm:text-sm/6">{children}</div>
        </div>
    );
}
