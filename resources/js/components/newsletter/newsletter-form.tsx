import FormField from '@/components/contact/form-field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { CircleCheckBig, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useRef } from 'react';

const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

export type NextIssue = { iso: string; label: string };

type NewsletterFormProps = { nextIssue: NextIssue };

type NewsletterFormData = { email: string; website: string /* honeypot, stays empty */ };

/**
 * Subscription card (Figma 262-8118): e-mail + button on one line (label visually hidden, error under the row),
 * avatars + next-issue date, "no spam" pill. Success replaces the form with the date and a next step.
 */
export default function NewsletterForm({ nextIssue }: NewsletterFormProps) {
    const { t } = useTranslation();
    const { flash } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors, reset } = useForm<NewsletterFormData>({ email: '', website: '' });
    const successTitle = useRef<HTMLHeadingElement>(null);

    // Move focus to the confirmation so keyboard / screen-reader users land on it after the redirect.
    useEffect(() => successTitle.current?.focus({ preventScroll: true }), [flash.newsletter]);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('newsletter.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <section
            aria-labelledby="newsletter-form-title"
            className="border-border bg-grey-5 relative flex w-full max-w-xl flex-col items-center gap-4 border p-4 sm:gap-6 sm:p-6"
        >
            {/* Border shimmer: a faint light arc gliding twice along the 1px outline on load, ring-mask hides the inside */}
            <span aria-hidden className="ring-mask pointer-events-none absolute -inset-px overflow-hidden motion-reduce:hidden">
                <span className="animate-border-shimmer via-foreground/20 absolute -inset-full bg-conic from-transparent from-40% to-transparent to-60%" />
            </span>
            <h2 id="newsletter-form-title" className="sr-only">
                {t('newsletter.submit')}
            </h2>
            {flash.newsletter ? (
                <div role="status" className="flex flex-col items-center gap-4 py-2 text-center">
                    <CircleCheckBig aria-hidden className="text-success size-8" strokeWidth={1.5} />
                    <div className="flex flex-col gap-2">
                        <h3 ref={successTitle} tabIndex={-1} className="text-xl font-medium tracking-tight focus:outline-none">
                            {t('newsletter.success_title')}
                        </h3>
                        <p className="text-muted-foreground max-w-md text-base/7 sm:text-sm/6">
                            {flash.newsletter}{' '}
                            <span className="text-foreground">
                                {t('newsletter.success_next')}{' '}
                                <time dateTime={nextIssue.iso} className="font-semibold">
                                    {nextIssue.label}
                                </time>
                                .
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button asChild size="lg">
                            <Link href={route('blog.index')} prefetch>
                                {t('newsletter.success_blog')}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href={route('home')} prefetch>
                                {t('contact.back_home')}
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} noValidate className="flex w-full flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                            <FormField id="newsletter-email" label={t('newsletter.email')} error={errors.email} required hideLabel externalError>
                                {(aria) => (
                                    <Input
                                        {...aria}
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        enterKeyHint="send"
                                        placeholder={t('newsletter.email_placeholder')}
                                        className="bg-card"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                )}
                            </FormField>
                            <Button type="submit" size="lg" disabled={processing} className="w-full sm:w-auto">
                                {processing ? t('newsletter.submitting') : t('newsletter.submit')}
                            </Button>
                        </div>
                        {/* Under the whole row so the button never jumps */}
                        {errors.email && (
                            <p id="newsletter-email-error" className="text-destructive text-sm">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Honeypot: invisible to people, filled by bots, rejected server-side */}
                    <div aria-hidden className="hidden">
                        <label htmlFor="newsletter-website">Website</label>
                        <input
                            id="newsletter-website"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={data.website}
                            onChange={(e) => setData('website', e.target.value)}
                        />
                    </div>

                    <p className="text-muted-foreground flex items-start gap-3 text-xs sm:items-center">
                        <span aria-hidden className="flex -space-x-1.5">
                            {ADVISORS.map((a) => (
                                <Avatar key={a.id} className="ring-card size-7 ring-2">
                                    <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                    <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">{a.initials}</AvatarFallback>
                                </Avatar>
                            ))}
                        </span>
                        <span>
                            {t('newsletter.next_issue')}{' '}
                            <time dateTime={nextIssue.iso} className="text-foreground font-semibold">
                                {nextIssue.label}
                            </time>
                            .
                        </span>
                    </p>
                </form>
            )}

            <p className="bg-card text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
                <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
                {t('newsletter.no_spam')}
            </p>
        </section>
    );
}
