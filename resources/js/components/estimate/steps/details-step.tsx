import FormField from '@/components/contact/form-field';
import AddressAutocomplete from '@/components/estimate/address-autocomplete';
import StepHeading from '@/components/estimate/step-heading';
import StepperInput from '@/components/estimate/stepper-input';
import { type EstimateStepProps, type EstimateValidity } from '@/components/estimate/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';

type DetailsStepProps = EstimateStepProps & {
    valid: EstimateValidity;
    floors: string[];
    features: string[];
    conditions: string[];
    googleMapsKey: string | null;
    locale: string;
};

/** Keeps the digits, shows them grouped in the French way (Intl handles the narrow no-break spaces). */
const formatValue = (digits: string) => (digits ? Number(digits).toLocaleString('fr-FR') : '');

/** Step 3 — the property: address, surface, floor + lift, rooms / bedrooms, selling points, condition, estimated value. */
export default function DetailsStep({
    data,
    setData,
    errors,
    complete,
    valid,
    floors,
    features,
    conditions,
    googleMapsKey,
    locale,
}: DetailsStepProps) {
    const { t } = useTranslation();
    // Radix Select opens on pointerdown, not on the synthetic click a <label> sends: open it ourselves from the label.
    const [floorOpen, setFloorOpen] = useState(false);
    const [conditionOpen, setConditionOpen] = useState(false);

    const toggleFeature = (feature: string, on: boolean) =>
        setData('features', on ? [...new Set([...data.features, feature])] : data.features.filter((f) => f !== feature));

    return (
        <fieldset aria-labelledby="step-details" className="flex flex-col gap-6 py-10">
            <StepHeading number={3} id="step-details" complete={complete}>
                {t('estimate.step_details')}
            </StepHeading>
            <FormField id="address" label={t('estimate.address')} error={errors.address} required>
                {(aria) => (
                    <AddressAutocomplete
                        aria={aria}
                        value={data.address}
                        onChange={(next) => setData('address', next)}
                        valid={valid.address}
                        apiKey={googleMapsKey}
                        locale={locale}
                        placeholder={t('estimate.address_placeholder')}
                    />
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
            <div className="flex items-center gap-3">
                <Checkbox
                    id="elevator"
                    name="elevator"
                    checked={data.elevator}
                    onCheckedChange={(checked) => setData('elevator', checked === true)}
                />
                <Label htmlFor="elevator" className="text-base/6 font-normal sm:text-sm/5">
                    {t('estimate.elevator')}
                </Label>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                <FormField id="rooms" label={t('estimate.rooms')} error={errors.rooms} required>
                    {(aria) => (
                        <StepperInput
                            {...aria}
                            name="rooms"
                            min={1}
                            max={10}
                            value={data.rooms}
                            // Bedrooms never exceed rooms (same rule as the server): lowering the rooms pulls the bedrooms down in the same update
                            onChange={(v) => setData((prev) => ({ ...prev, rooms: v, bedrooms: Math.min(prev.bedrooms, v) }))}
                        />
                    )}
                </FormField>
                <FormField id="bedrooms" label={t('estimate.bedrooms')} error={errors.bedrooms} required>
                    {(aria) => (
                        <StepperInput
                            {...aria}
                            name="bedrooms"
                            min={0}
                            max={data.rooms}
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
                <FormField id="condition" label={t('estimate.condition')} error={errors.condition} onLabelClick={() => setConditionOpen(true)}>
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
    );
}
