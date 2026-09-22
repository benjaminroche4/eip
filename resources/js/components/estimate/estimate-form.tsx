import EstimateErrorSummary from '@/components/estimate/estimate-error-summary';
import EstimateMobileBar from '@/components/estimate/estimate-mobile-bar';
import EstimateRecap from '@/components/estimate/estimate-recap';
import EstimateSuccess from '@/components/estimate/estimate-success';
import ContactMethodStep from '@/components/estimate/steps/contact-method-step';
import ContactStep from '@/components/estimate/steps/contact-step';
import DetailsStep from '@/components/estimate/steps/details-step';
import MoreStep from '@/components/estimate/steps/more-step';
import PropertyTypeStep from '@/components/estimate/steps/property-type-step';
import { type EstimateFormData, FORM_ID } from '@/components/estimate/types';
import GradientHairline from '@/components/layout/gradient-hairline';
import { useEstimateDraft } from '@/hooks/use-estimate-draft';
import { useEstimateValidation } from '@/hooks/use-estimate-validation';
import { type SharedData } from '@/types';
import { useForm, usePage } from '@inertiajs/react';
import { type FormEvent } from 'react';

type EstimateFormProps = {
    propertyTypes: string[];
    contactMethods: string[];
    floors: string[];
    features: string[];
    conditions: string[];
    googleMapsKey: string | null;
};

/**
 * Valuation request (Figma 696-13105, laid out as form + live recap): five numbered steps on the left — property type
 * (cards), contact, property details (floor list + lift, rooms, selling points, condition, value), contact method (cards),
 * free text + consent — and a sticky summary card on the right that fills in as the owner types and can submit.
 * This file only composes: the steps live in `steps/`, the draft in `useEstimateDraft`, the client-side checks and the
 * "incomplete submit" behaviour in `useEstimateValidation`, the mobile bar + sheet in `EstimateMobileBar`.
 * Server-side validation: error summary at the top, first invalid field focused, lines flagged in the recap.
 */
export default function EstimateForm({ propertyTypes, contactMethods, floors, features, conditions, googleMapsKey }: EstimateFormProps) {
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

    const { clearDraft } = useEstimateDraft(data, setData);
    const { valid, complete, errors, errorFields, flagMissing } = useEstimateValidation(data, serverErrors);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (flagMissing()) return;
        post(route('estimate.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearDraft();
            },
        });
    };

    if (flash.success) return <EstimateSuccess message={flash.success} />;

    const step = { data, setData, errors };

    return (
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-x-16">
            <div className="lg:col-span-3">
                <form id={FORM_ID} onSubmit={submit} noValidate className="flex flex-col">
                    <EstimateErrorSummary fields={errorFields} errors={errors} />

                    {/* 1 — property type */}
                    <PropertyTypeStep {...step} complete={complete.type} propertyTypes={propertyTypes} />

                    {/* 2 — who to contact */}
                    <GradientHairline />
                    <ContactStep {...step} complete={complete.contact} valid={valid} />

                    {/* 3 — property details */}
                    <GradientHairline />
                    <DetailsStep
                        {...step}
                        complete={complete.details}
                        valid={valid}
                        floors={floors}
                        features={features}
                        conditions={conditions}
                        googleMapsKey={googleMapsKey}
                        locale={locale}
                    />

                    {/* 4 — contact method */}
                    <GradientHairline />
                    <ContactMethodStep {...step} complete={complete.method} contactMethods={contactMethods} />

                    {/* 5 — anything else + consent */}
                    <GradientHairline />
                    <MoreStep {...step} complete={complete.more} processing={processing} advisor={seo.advisor} />
                </form>
                <EstimateMobileBar values={data} processing={processing} />
            </div>
            <div className="hidden lg:col-span-2 lg:block">
                <div className="lg:sticky lg:top-24">
                    <EstimateRecap values={data} />
                </div>
            </div>
        </div>
    );
}
