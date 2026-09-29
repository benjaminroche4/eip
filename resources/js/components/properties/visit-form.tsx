import FormField from '@/components/contact/form-field';
import PhoneInput from '@/components/contact/phone-input';
import { type Property } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, CalendarCheck, CircleCheckBig, X } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

type VisitFormData = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    topic: string;
    message: string;
    consent: boolean;
    website: string;
};

type VisitFormProps = { property: Property; reference: string };

/**
 * Viewing request from the advisor card (2026-09-28): the primary « Demander une visite » opens a **modal** (user
 * decision 2026-09-29: the unfolded fields made the card far too tall) — the site's sand dialog with name, e-mail,
 * phone, an optional message, consent, the honeypot — posted to the contact endpoint with the listing written in the
 * message, so the request lands with the reference. On success the dialog closes and the confirmation shows in the
 * card. (The « next viewings » slot pills were removed on 2026-09-29, user decision.)
 */
export default function VisitForm({ property, reference }: VisitFormProps) {
    const { t } = useTranslation();
    const { flash } = usePage<SharedData>().props;
    const id = useId();
    const [open, setOpen] = useState(false);
    const success = useRef<HTMLParagraphElement>(null);
    // The button that opened the modal: the focus goes back to it on close (a11y rule)
    const opener = useRef<HTMLElement | null>(null);
    // The visitor's own note; the form's `message` field always holds the assembled text (listing, reference, note)
    const [note, setNote] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm<VisitFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        topic: property.transaction === 'rent' ? 'other' : 'buy',
        message: '',
        consent: false,
        website: '',
    });
    useEffect(() => {
        if (flash.success) setOpen(false);
        success.current?.focus({ preventScroll: true });
    }, [flash.success]);

    const assembled = [t('property.visit_message', { title: property.title, reference }), note.trim() || null].filter(Boolean).join('\n');
    useEffect(() => {
        if (data.message !== assembled) setData('message', assembled);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- setData is stable
    }, [assembled]);
    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('contact.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    if (flash.success) {
        return (
            <p ref={success} tabIndex={-1} role="status" className="flex items-start gap-2 text-sm focus:outline-none">
                <CircleCheckBig aria-hidden className="text-success mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                {flash.success}
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={(e) => {
                    opener.current = e.currentTarget;
                    setOpen(true);
                }}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                {t('property.contact_cta')}
                <ArrowUpRight aria-hidden />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                {/* The site's sand dialog, as the listing filters: title with the icon tile, own close button */}
                <DialogContent
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        opener.current?.focus();
                    }}
                    className="bg-background-05 max-h-[90dvh] overflow-y-auto rounded-none p-6 shadow-none sm:max-w-md [&>button]:hidden"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="flex items-center gap-3 text-xl font-medium tracking-tight">
                                <span aria-hidden className="border-secondary-30 bg-card flex size-9 shrink-0 items-center justify-center border">
                                    <CalendarCheck className="size-4" strokeWidth={1.5} />
                                </span>
                                {t('property.contact_cta')}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm text-pretty">{property.title}</DialogDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label={t('property.visit_close')}
                            onClick={() => setOpen(false)}
                            className="bg-card shrink-0"
                        >
                            <X aria-hidden />
                        </Button>
                    </div>
                    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField id={`${id}-first`} label={t('contact.first_name')} error={errors.first_name} required>
                                {(aria) => (
                                    <Input
                                        {...aria}
                                        name="first_name"
                                        autoComplete="given-name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                    />
                                )}
                            </FormField>
                            <FormField id={`${id}-last`} label={t('contact.last_name')} error={errors.last_name} required>
                                {(aria) => (
                                    <Input
                                        {...aria}
                                        name="last_name"
                                        autoComplete="family-name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                    />
                                )}
                            </FormField>
                        </div>
                        <FormField id={`${id}-email`} label={t('contact.email')} error={errors.email} required>
                            {(aria) => (
                                <Input
                                    {...aria}
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            )}
                        </FormField>
                        <FormField id={`${id}-phone`} label={t('contact.phone')} error={errors.phone} required>
                            {(aria) => <PhoneInput {...aria} name="phone" value={data.phone} onChange={(v) => setData('phone', v)} />}
                        </FormField>
                        <FormField id={`${id}-message`} label={t('contact.message')} error={errors.message} optional>
                            {(aria) => <Textarea {...aria} name="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
                        </FormField>
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id={`${id}-consent`}
                                name="consent"
                                checked={data.consent}
                                onCheckedChange={(v) => setData('consent', v === true)}
                                aria-invalid={errors.consent ? true : undefined}
                                aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
                            />
                            <label htmlFor={`${id}-consent`} className="text-muted-foreground text-xs text-pretty">
                                {t('contact.consent')}
                            </label>
                        </div>
                        {errors.consent && (
                            <p id={`${id}-consent-error`} className="text-destructive text-xs">
                                {errors.consent}
                            </p>
                        )}
                        {/* The assembled message the endpoint receives (listing, reference, note) */}
                        <input type="hidden" name="message" value={data.message} readOnly />
                        {/* Honeypot: bots fill it, humans never see it */}
                        <div className="hidden" aria-hidden>
                            <input
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={processing} className="w-full">
                            {processing ? t('property.visit_sending') : t('property.visit_submit')}
                            <ArrowUpRight aria-hidden />
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
