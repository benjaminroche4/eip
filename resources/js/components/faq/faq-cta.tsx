import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export type FaqCtaProps = { title: string; button: string };

/**
 * "Didn't find your answer?" — end of every topic and the empty search state: a thin sand strip with an outline
 * button (border only) on the right, the advisor's avatar on the left inside it instead of an icon (ui.sh option « Bande sable », decision 2026-08-27).
 */
export default function FaqCta({ title, button }: FaqCtaProps) {
    const { seo } = usePage<SharedData>().props;
    const advisor = seo.advisor;

    return (
        <div className="bg-background-08 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base/7 sm:text-sm/6">{title}</p>
            <Button asChild variant="outline" className="shrink-0 self-start pl-1.5 sm:self-auto">
                <Link href={route('contact')} prefetch>
                    {advisor && (
                        <Avatar aria-hidden className="border-border size-6 border">
                            <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                            <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                {advisor.name
                                    .split(' ')
                                    .map((w) => w[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    {button}
                </Link>
            </Button>
        </div>
    );
}
