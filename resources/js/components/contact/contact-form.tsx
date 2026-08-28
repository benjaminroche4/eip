import ContactSuccess from '@/components/contact/contact-success';
import FormField from '@/components/contact/form-field';
import PhoneInput from '@/components/contact/phone-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, BellRing } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const ADVISORS = [
    { id: 1, initials: 'AB' },
    { id: 2, initials: 'CD' },
    { id: 3, initials: 'EF' },
] as const;

const MESSAGE_MAX = 2000;

type ContactFormProps = { topics: string[] };

type ContactFormData = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    topic: string;
    message: string;
    consent: boolean;
    website: string; // honeypot, stays empty
};

/**
 * "Request a callback" card (Figma 261-7411): advisor avatars + availability badge,
 * title, then the form posted with Inertia (server-side validation, errors inline, success flash).
 */
export default function ContactForm({ topics }: ContactFormProps) {
    const { t } = useTranslation();
    const { flash, seo } = usePage<SharedData>().props;
    const { data, setData, post, processing, errors, reset } = useForm<ContactFormData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        topic: '',
        message: '',
        consent: false,
        website: '',
    });

    // Radix Select opens on pointerdown, not on the synthetic click a <label> sends: open it ourselves from the label.
    const [topicOpen, setTopicOpen] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('contact.store'), { preserveScroll: true, onSuccess: () => reset() });
    };

    return (
        <section aria-labelledby="contact-form-title" className="border-secondary-30 bg-card border p-2 shadow-lg shadow-black/5">
            <div className="from-background-05 flex flex-col gap-10 bg-gradient-to-b to-transparent px-4 pt-7 pb-6 sm:px-8 sm:pt-8">
                {flash.success ? (
                    <ContactSuccess message={flash.success} />
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="flex items-center gap-2">
                                <ul role="list" aria-label={t('footer.advisors')} className="flex -space-x-2">
                                    {ADVISORS.map((a) => (
                                        <li key={a.id}>
                                            <Avatar className="ring-card size-7 ring-2">
                                                <AvatarImage src={`/images/advisors/advisor-${a.id}.webp`} alt="" loading="lazy" />
                                                <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                                    {a.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        </li>
                                    ))}
                                </ul>
                                {seo.hours.open && (
                                    <Badge
                                        variant="outline"
                                        className="bg-card text-success gap-2 border-transparent font-medium"
                                        title={seo.hours.label}
                                    >
                                        <span aria-hidden className="relative flex size-2 shrink-0">
                                            <span className="bg-success/60 absolute inset-0 animate-ping rounded-full motion-reduce:hidden" />
                                            <span className="bg-success relative size-2 rounded-full" />
                                        </span>
                                        {t('contact.available')}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h2 id="contact-form-title" className="text-2xl font-medium tracking-tight">
                                    {t('contact.form_title')}
                                </h2>
                                <p className="text-muted-foreground mx-auto max-w-md text-base/7 sm:text-sm/6">{t('contact.form_text')}</p>
                            </div>
                        </div>

                        <form onSubmit={submit} noValidate className="flex flex-col gap-5 sm:gap-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
                                <FormField id="first_name" label={t('contact.first_name')} error={errors.first_name} required>
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
                                <FormField id="last_name" label={t('contact.last_name')} error={errors.last_name} required>
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

                            <FormField id="email" label={t('contact.email')} error={errors.email} required>
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

                            <FormField id="phone" label={t('contact.phone')} error={errors.phone} required>
                                {(aria) => <PhoneInput {...aria} name="phone" value={data.phone} onChange={(v) => setData('phone', v)} />}
                            </FormField>

                            <FormField id="topic" label={t('contact.topic')} error={errors.topic} required onLabelClick={() => setTopicOpen(true)}>
                                {(aria) => (
                                    <Select
                                        name="topic"
                                        value={data.topic}
                                        onValueChange={(v) => setData('topic', v)}
                                        open={topicOpen}
                                        onOpenChange={setTopicOpen}
                                    >
                                        <SelectTrigger {...aria} className="w-full">
                                            <SelectValue placeholder={t('contact.topic_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {topics.map((topic) => (
                                                <SelectItem key={topic} value={topic}>
                                                    {t(`contact.topics.${topic}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormField>

                            <FormField id="message" label={t('contact.message')} error={errors.message}>
                                {(aria) => (
                                    <div className="relative">
                                        <Textarea
                                            {...aria}
                                            name="message"
                                            maxLength={MESSAGE_MAX}
                                            placeholder={t('contact.message_placeholder')}
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            className="pb-8"
                                        />
                                        <span
                                            aria-hidden
                                            className="text-muted-foreground pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums"
                                        >
                                            {data.message.length}/{MESSAGE_MAX}
                                        </span>
                                    </div>
                                )}
                            </FormField>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="consent"
                                        name="consent"
                                        checked={data.consent}
                                        onCheckedChange={(checked) => setData('consent', checked === true)}
                                        aria-required
                                        aria-invalid={Boolean(errors.consent)}
                                        aria-describedby={errors.consent ? 'consent-error' : undefined}
                                        className="mt-0.5"
                                    />
                                    <Label htmlFor="consent" className="text-muted-foreground text-base/6 font-normal sm:text-sm/5">
                                        {t('contact.consent')}
                                    </Label>
                                </div>
                                {errors.consent && (
                                    <p id="consent-error" className="text-destructive text-sm">
                                        {errors.consent}
                                    </p>
                                )}
                            </div>

                            {/* Honeypot: invisible to people, filled by bots, rejected server-side */}
                            <div aria-hidden className="hidden">
                                <label htmlFor="website">Website</label>
                                <input
                                    id="website"
                                    name="website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <Button type="submit" size="lg" disabled={processing} className="w-full">
                                    {processing ? t('contact.submitting') : t('contact.submit')}
                                    <ArrowUpRight aria-hidden />
                                </Button>
                                <p className="text-muted-foreground flex items-center gap-2 text-center text-sm">
                                    <BellRing aria-hidden className="size-3.5 shrink-0" />
                                    {t('contact.response_time')}
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </section>
    );
}
