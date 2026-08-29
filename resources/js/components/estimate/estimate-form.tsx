import FormField from '@/components/contact/form-field';
import PhoneInput from '@/components/contact/phone-input';
import EstimateRecap from '@/components/estimate/estimate-recap';
import EstimateSuccess from '@/components/estimate/estimate-success';
import SelectionCards, { type SelectionOption } from '@/components/estimate/selection-cards';
import StepHeading from '@/components/estimate/step-heading';
import StepperInput from '@/components/estimate/stepper-input';
import GradientHairline from '@/components/layout/gradient-hairline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BellRing,
    Building,
    Building2,
    Check,
    ChevronDown,
    ChevronUp,
    CircleAlert,
    Clock,
    DoorOpen,
    FileCheck,
    Home,
    Info,
    Landmark,
    Layers,
    Lock,
    type LucideIcon,
    Mail,
    MessageCircle,
    Phone,
    SquarePlus,
    Warehouse,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';

const PROPERTY_ICONS: Record<string, LucideIcon> = {
    apartment: Building2,
    duplex: Layers,
    studio: DoorOpen,
    mansion: Landmark,
    house: Home,
    loft: Warehouse,
    building: Building,
    other: SquarePlus,
};
const CONTACT_ICONS: Record<string, LucideIcon> = { phone: Phone, whatsapp: MessageCircle, email: Mail };

const MESSAGE_MAX = 2000;
const FORM_ID = 'estimate-form';
const DRAFT_KEY = 'estimate-draft';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Field order on the page — the error summary and the "focus the first error" behaviour follow it. */
const FIELD_ORDER = [
    'property_type',
    'full_name',
    'email',
    'phone',
    'address',
    'surface',
    'floor',
    'rooms',
    'bedrooms',
    'condition',
    'estimated_value',
    'contact_method',
    'message',
    'consent',
];

type EstimateFormProps = { propertyTypes: string[]; contactMethods: string[]; floors: string[]; features: string[]; conditions: string[] };

type EstimateFormData = {
    property_type: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    surface: string;
    floor: string;
    elevator: boolean;
    rooms: number;
    bedrooms: number;
    features: string[];
    condition: string;
    estimated_value: string; // digits only; displayed grouped (1 500 000)
    contact_method: string;
    message: string;
    consent: boolean;
    website: string; // honeypot, stays empty
};

/** Keeps the digits, shows them grouped in the French way (Intl handles the narrow no-break spaces). */
const formatValue = (digits: string) => (digits ? Number(digits).toLocaleString('fr-FR') : '');

/**
 * Valuation request (Figma 696-13105, laid out as form + live recap): five numbered steps on the left — property type
 * (cards), contact, property details (floor list + lift, rooms, selling points, condition, value), contact method (cards),
 * free text + consent — and a sticky summary card on the right that fills in as the owner types and can submit.
 * Server-side validation: error summary at the top, first invalid field focused, lines flagged in the recap.
 */
export default function EstimateForm({ propertyTypes, contactMethods, floors, features, conditions }: EstimateFormProps) {
    const { t, tc } = useTranslation();
    const { flash, seo, locale } = usePage<SharedData>().props;
    const {
        data,
        setData,
        post,
        processing,
        errors: serverErrors,
        reset,
    } = useForm<EstimateFormData>({
        property_type: propertyTypes[0] ?? '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        surface: '',
        floor: '',
        elevator: false,
        rooms: 1,
        bedrooms: 1,
        features: [],
        condition: '',
        estimated_value: '',
        // English-speaking owners are mostly abroad: e-mail first; French ones get a call.
        contact_method: (locale === 'en' && contactMethods.includes('email') ? 'email' : contactMethods[0]) ?? '',
        message: '',
        consent: false,
        website: '',
    });

    // Draft: what was typed survives a reload / a detour to another page (session only, never the consent nor the honeypot).
    useEffect(() => {
        try {
            const draft = window.sessionStorage.getItem(DRAFT_KEY);
            if (draft) setData((current) => ({ ...current, ...JSON.parse(draft), consent: false, website: '' }));
        } catch {
            /* storage unavailable (private mode, quota): no draft */
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        try {
            const { consent, website, ...draft } = data;
            void consent;
            void website;
            window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
            /* ignore */
        }
    }, [data]);

    // Positive feedback: a quiet check once a field is valid, without waiting for the server
    const valid = {
        email: EMAIL.test(data.email.trim()),
        phone: data.phone !== '' && isValidPhoneNumber(data.phone),
        address: data.address.trim().length >= 5,
    };
    const complete = {
        type: data.property_type !== '',
        contact: data.full_name.trim() !== '' && valid.email && valid.phone,
        details: valid.address && data.surface !== '',
        method: data.contact_method !== '',
        more: data.consent,
    };

    // Submitting an incomplete form never leaves the page: the first missing field (in page order) is flagged and focused.
    const [localErrors, setLocalErrors] = useState<Partial<Record<string, string>>>({});
    useEffect(() => setLocalErrors({}), [data]); // any edit clears the local flags
    const errors: Partial<Record<string, string>> = { ...serverErrors, ...localErrors };
    const missing = (): string | null => {
        const checks: Record<string, boolean> = {
            property_type: data.property_type !== '',
            full_name: data.full_name.trim() !== '',
            email: valid.email,
            phone: valid.phone,
            address: valid.address,
            surface: data.surface !== '',
            contact_method: data.contact_method !== '',
            consent: data.consent,
        };
        return FIELD_ORDER.find((f) => f in checks && !checks[f]) ?? null;
    };

    // Radix Select opens on pointerdown, not on the synthetic click a <label> sends: open it ourselves from the label.
    const [floorOpen, setFloorOpen] = useState(false);
    const [recapOpen, setRecapOpen] = useState(false);
    // The sheet belongs to the mobile layout: close it as soon as the viewport reaches the desktop breakpoint (lg)
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 64rem)');
        const onChange = (e: MediaQueryListEvent) => e.matches && setRecapOpen(false);
        desktop.addEventListener('change', onChange);
        return () => desktop.removeEventListener('change', onChange);
    }, []);
    const mobileBar = useRef<HTMLDivElement>(null);
    const [conditionOpen, setConditionOpen] = useState(false);

    const errorFields = FIELD_ORDER.filter((f) => errors[f as keyof EstimateFormData]);

    // After a failed submit the errors come back with the redirect: bring the visitor to the first one.
    useEffect(() => {
        if (errorFields.length > 0) focusField(errorFields[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorFields.join(',')]);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const field = missing();
        if (field) {
            setLocalErrors({ [field]: t('estimate.required_hint') });
            focusField(field);
            return;
        }
        post(route('estimate.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                try {
                    window.sessionStorage.removeItem(DRAFT_KEY);
                } catch {
                    /* ignore */
                }
            },
        });
    };

    if (flash.success) return <EstimateSuccess message={flash.success} />;

    const propertyOptions: SelectionOption[] = propertyTypes.map((value) => ({
        value,
        label: t(`estimate.property_types.${value}`),
        icon: PROPERTY_ICONS[value] ?? SquarePlus,
    }));
    const contactOptions: SelectionOption[] = contactMethods.map((value) => ({
        value,
        label: t(`estimate.contact_methods.${value}`),
        icon: CONTACT_ICONS[value] ?? Phone,
    }));
    const advisor = seo.advisor;

    const toggleFeature = (feature: string, on: boolean) =>
        setData('features', on ? [...new Set([...data.features, feature])] : data.features.filter((f) => f !== feature));

    const checkbox = (field: 'elevator', label: string) => (
        <div className="flex items-center gap-3">
            <Checkbox id={field} name={field} checked={data[field]} onCheckedChange={(checked) => setData(field, checked === true)} />
            <Label htmlFor={field} className="text-base/6 font-normal sm:text-sm/5">
                {label}
            </Label>
        </div>
    );

    return (
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-x-16">
            <div className="lg:col-span-3">
                <form id={FORM_ID} onSubmit={submit} noValidate className="flex flex-col">
                    {/* Error summary: count + one link per field, focused on arrival */}
                    {errorFields.length > 0 && (
                        <div role="alert" tabIndex={-1} className="border-destructive/30 bg-destructive/5 mb-9 flex flex-col gap-2 border p-4">
                            <p className="text-destructive flex items-center gap-2 text-sm font-medium">
                                <CircleAlert aria-hidden className="size-4 shrink-0" />
                                {tc('estimate.errors_title', errorFields.length)}
                            </p>
                            <ul role="list" className="flex flex-col gap-1 pl-6 text-sm">
                                {errorFields.map((field) => (
                                    <li key={field}>
                                        <a
                                            href={`#${field}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                focusField(field);
                                            }}
                                            className="focus-ring underline underline-offset-2"
                                        >
                                            {errors[field as keyof EstimateFormData]}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 1 — property type */}
                    <fieldset aria-labelledby="step-type" className="flex flex-col gap-6 pb-10">
                        <StepHeading number={1} id="step-type" complete={complete.type}>
                            {t('estimate.step_type')}
                        </StepHeading>
                        <SelectionCards
                            id="property_type"
                            name="property_type"
                            value={data.property_type}
                            onChange={(v) => {
                                setData('property_type', v);
                                focusField('full_name'); // one click, and the visitor is already on the next question
                            }}
                            options={propertyOptions}
                            aria-labelledby="step-type"
                            aria-invalid={Boolean(errors.property_type)}
                            aria-describedby={errors.property_type ? 'property_type-error' : undefined}
                        />
                        {errors.property_type && (
                            <p id="property_type-error" className="text-destructive text-sm">
                                {errors.property_type}
                            </p>
                        )}
                    </fieldset>

                    {/* 2 — who to contact */}
                    <GradientHairline />
                    <fieldset aria-labelledby="step-contact" className="flex flex-col gap-6 py-10">
                        <StepHeading number={2} id="step-contact" complete={complete.contact}>
                            {t('estimate.step_contact')}
                        </StepHeading>
                        <FormField id="full_name" label={t('estimate.full_name')} error={errors.full_name} required>
                            {(aria) => (
                                <Input
                                    {...aria}
                                    name="full_name"
                                    autoComplete="name"
                                    placeholder={t('estimate.full_name_placeholder')}
                                    value={data.full_name}
                                    onChange={(e) => setData('full_name', e.target.value)}
                                />
                            )}
                        </FormField>
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                            <FormField id="email" label={t('estimate.email')} error={errors.email} required>
                                {(aria) => (
                                    <div className="relative">
                                        <Input
                                            {...aria}
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            inputMode="email"
                                            placeholder={t('estimate.email_placeholder')}
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className={cn(valid.email && 'pr-9')}
                                        />
                                        {valid.email && (
                                            <span className="text-success pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                                                <Check aria-hidden className="animate-pop size-4 motion-reduce:animate-none" />
                                                <span className="sr-only">{t('estimate.valid')}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </FormField>
                            <FormField id="phone" label={t('estimate.phone')} error={errors.phone} required>
                                {(aria) => (
                                    <div className="relative">
                                        <PhoneInput {...aria} name="phone" value={data.phone} onChange={(v) => setData('phone', v)} />
                                        {valid.phone && (
                                            <span className="text-success pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                                                <Check aria-hidden className="animate-pop size-4 motion-reduce:animate-none" />
                                                <span className="sr-only">{t('estimate.valid')}</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </FormField>
                        </div>
                    </fieldset>

                    {/* 3 — property details */}
                    <GradientHairline />
                    <fieldset aria-labelledby="step-details" className="flex flex-col gap-6 py-10">
                        <StepHeading number={3} id="step-details" complete={complete.details}>
                            {t('estimate.step_details')}
                        </StepHeading>
                        <FormField id="address" label={t('estimate.address')} error={errors.address} required>
                            {(aria) => (
                                <div className="relative">
                                    <Input
                                        {...aria}
                                        name="address"
                                        autoComplete="street-address"
                                        placeholder={t('estimate.address_placeholder')}
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className={cn(valid.address && 'pr-9')}
                                    />
                                    {valid.address && (
                                        <span className="text-success pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                                            <Check aria-hidden className="animate-pop size-4 motion-reduce:animate-none" />
                                            <span className="sr-only">{t('estimate.valid')}</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </FormField>
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                            <FormField id="surface" label={t('estimate.surface')} error={errors.surface} required>
                                {(aria) => (
                                    <div className="relative">
                                        <Input
                                            {...aria}
                                            type="text"
                                            name="surface"
                                            inputMode="numeric"
                                            min={5}
                                            max={999}
                                            placeholder={t('estimate.surface_placeholder')}
                                            value={data.surface}
                                            onChange={(e) => setData('surface', e.target.value.replace(/\D/g, '').slice(0, 3))} // 999 m² max, digits only
                                            className="[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                                            {t('estimate.surface_unit')}
                                        </span>
                                    </div>
                                )}
                            </FormField>
                            <FormField id="floor" label={t('estimate.floor')} error={errors.floor} onLabelClick={() => setFloorOpen(true)}>
                                {(aria) => (
                                    <Select
                                        name="floor"
                                        value={data.floor}
                                        onValueChange={(v) => setData('floor', v)}
                                        open={floorOpen}
                                        onOpenChange={setFloorOpen}
                                    >
                                        <SelectTrigger {...aria} className="w-full">
                                            <SelectValue placeholder={t('estimate.floor_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {floors.map((floor) => (
                                                <SelectItem key={floor} value={floor}>
                                                    {t(`estimate.floors.${floor}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormField>
                        </div>
                        {checkbox('elevator', t('estimate.elevator'))}
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                            <FormField id="rooms" label={t('estimate.rooms')} error={errors.rooms} required>
                                {(aria) => (
                                    <StepperInput {...aria} name="rooms" min={1} max={10} value={data.rooms} onChange={(v) => setData('rooms', v)} />
                                )}
                            </FormField>
                            <FormField id="bedrooms" label={t('estimate.bedrooms')} error={errors.bedrooms} required>
                                {(aria) => (
                                    <StepperInput
                                        {...aria}
                                        name="bedrooms"
                                        min={0}
                                        max={10}
                                        value={data.bedrooms}
                                        onChange={(v) => setData('bedrooms', v)}
                                    />
                                )}
                            </FormField>
                        </div>
                        {/* Selling points: a two-column grid of checkboxes, as many as apply */}
                        <fieldset id="features" className="flex flex-col gap-3">
                            <legend className="mb-3 text-sm font-medium">{t('estimate.features')}</legend>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`feature-${feature}`}
                                            name="features[]"
                                            value={feature}
                                            checked={data.features.includes(feature)}
                                            onCheckedChange={(checked) => toggleFeature(feature, checked === true)}
                                        />
                                        <Label htmlFor={`feature-${feature}`} className="text-base/6 font-normal sm:text-sm/5">
                                            {t(`estimate.features_list.${feature}`)}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                            <FormField
                                id="condition"
                                label={t('estimate.condition')}
                                error={errors.condition}
                                onLabelClick={() => setConditionOpen(true)}
                            >
                                {(aria) => (
                                    <Select
                                        name="condition"
                                        value={data.condition}
                                        onValueChange={(v) => setData('condition', v)}
                                        open={conditionOpen}
                                        onOpenChange={setConditionOpen}
                                    >
                                        <SelectTrigger {...aria} className="w-full">
                                            <SelectValue placeholder={t('estimate.condition_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {conditions.map((condition) => (
                                                <SelectItem key={condition} value={condition}>
                                                    {t(`estimate.conditions.${condition}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormField>
                            <FormField id="estimated_value" label={t('estimate.estimated_value')} error={errors.estimated_value}>
                                {(aria) => (
                                    <div className="relative">
                                        <Input
                                            {...aria}
                                            name="estimated_value"
                                            inputMode="numeric"
                                            placeholder={t('estimate.estimated_value_placeholder')}
                                            value={formatValue(data.estimated_value)}
                                            onChange={(e) => setData('estimated_value', e.target.value.replace(/\D/g, '').slice(0, 9))}
                                            className="pr-8 tabular-nums"
                                        />
                                        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                                            {t('estimate.estimated_value_unit')}
                                        </span>
                                    </div>
                                )}
                            </FormField>
                        </div>
                    </fieldset>

                    {/* 4 — contact method */}
                    <GradientHairline />
                    <fieldset aria-labelledby="step-method" className="flex flex-col gap-6 py-10">
                        <StepHeading number={4} id="step-method" complete={complete.method}>
                            {t('estimate.step_method')}
                        </StepHeading>
                        <SelectionCards
                            id="contact_method"
                            name="contact_method"
                            value={data.contact_method}
                            onChange={(v) => {
                                setData('contact_method', v);
                                focusField('message');
                            }}
                            options={contactOptions}
                            aria-labelledby="step-method"
                            aria-invalid={Boolean(errors.contact_method)}
                        />
                        {data.contact_method === 'whatsapp' && (
                            <p className="text-muted-foreground flex items-start gap-2 text-sm">
                                <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                                {t('estimate.whatsapp_hint')}
                            </p>
                        )}
                    </fieldset>

                    {/* 5 — anything else + consent */}
                    <GradientHairline />
                    <fieldset aria-labelledby="step-more" className="flex flex-col gap-6 pt-10">
                        <StepHeading number={5} id="step-more" complete={complete.more}>
                            {t('estimate.step_more')}
                        </StepHeading>
                        <FormField id="message" label={t('estimate.message')} error={errors.message}>
                            {(aria) => (
                                <div className="relative">
                                    <Textarea
                                        {...aria}
                                        name="message"
                                        maxLength={MESSAGE_MAX}
                                        placeholder={t('estimate.message_placeholder')}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        className="min-h-32 pb-8"
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
                                <Label htmlFor="consent" className="text-base/6 font-normal sm:text-sm/5">
                                    {t('estimate.consent')}
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

                        <div className="flex flex-col items-center gap-5 pt-2">
                            <Button type="submit" size="lg" disabled={processing} className="hidden w-full lg:inline-flex">
                                {processing ? t('estimate.submitting') : t('estimate.submit')}
                                <ArrowUpRight aria-hidden />
                            </Button>
                            {/* Trust line: three micro-mentions, then the advisor who will handle the request */}
                            <ul role="list" className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                                {[
                                    { icon: Lock, label: t('estimate.trust_confidential') },
                                    { icon: FileCheck, label: t('estimate.trust_free') },
                                    { icon: Clock, label: t('estimate.trust_delay') },
                                ].map(({ icon: Icon, label }) => (
                                    <li key={label} className="flex items-center gap-1.5">
                                        <Icon aria-hidden className="size-3.5 shrink-0" />
                                        {label}
                                    </li>
                                ))}
                            </ul>
                            {advisor ? (
                                <p className="text-muted-foreground flex items-center gap-2 text-center text-sm">
                                    <Avatar aria-hidden className="border-border size-6 border">
                                        <AvatarImage src={advisor.photo} alt="" loading="lazy" />
                                        <AvatarFallback className="bg-background-10 text-foreground text-xs font-medium">
                                            {advisor.name
                                                .split(' ')
                                                .map((w) => w[0])
                                                .join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    {t('estimate.handled_by', { name: advisor.name })}
                                </p>
                            ) : (
                                <p className="text-muted-foreground flex items-center gap-2 text-center text-sm">
                                    <BellRing aria-hidden className="size-3.5 shrink-0" />
                                    {t('estimate.response_time')}
                                </p>
                            )}
                        </div>
                    </fieldset>
                </form>
                {/* Dim over the page while the recap is up (non-modal sheets have no overlay); a tap closes it. Sibling of the bar: a `fixed` child of a backdrop-blur element would be trapped inside it */}
                {recapOpen && (
                    <div
                        aria-hidden
                        onClick={() => setRecapOpen(false)}
                        className="animate-fade-in fixed inset-0 z-40 bg-black/30 motion-reduce:animate-none lg:hidden"
                    />
                )}
                {/* Mobile: the submit bar sticks to the bottom of the screen while the form is on screen, then scrolls away with it (no second button: the in-form one is desktop only) */}
                <div
                    ref={mobileBar}
                    className="border-border bg-card/95 pointer-events-auto sticky bottom-0 z-60 -mx-4 mt-6 flex items-center gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 lg:hidden"
                >
                    <Button type="submit" form={FORM_ID} size="lg" disabled={processing} className="flex-1">
                        {processing ? t('estimate.submitting') : t('estimate.submit')}
                        <ArrowUpRight aria-hidden />
                    </Button>
                    {/* Non-modal: the bar underneath stays in the accessibility tree and clickable while the recap is up */}
                    <Sheet open={recapOpen} onOpenChange={setRecapOpen} modal={false}>
                        <SheetTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                aria-label={t('estimate.recap_open')}
                                aria-expanded={recapOpen}
                                className="px-3"
                            >
                                {recapOpen ? <ChevronDown aria-hidden /> : <ChevronUp aria-hidden />}
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="bottom"
                            hideClose
                            // Stops above the bar (its height + safe area); a tap on the bar is not "outside" — the arrow toggles, the button submits
                            onPointerDownOutside={(e) => mobileBar.current?.contains(e.target as Node) && e.preventDefault()}
                            className="bg-card bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-h-[75dvh] overflow-y-auto border-t p-0"
                        >
                            <SheetTitle className="sr-only">{t('estimate.recap_title')}</SheetTitle>
                            <SheetDescription className="sr-only">{t('estimate.recap_progress')}</SheetDescription>
                            <EstimateRecap values={data} frameless />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <div className="hidden lg:col-span-2 lg:block">
                <div className="lg:sticky lg:top-24">
                    <EstimateRecap values={data} />
                </div>
            </div>
        </div>
    );
}
