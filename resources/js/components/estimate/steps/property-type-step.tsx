import SelectionCards, { type SelectionOption } from '@/components/estimate/selection-cards';
import StepHeading from '@/components/estimate/step-heading';
import { type EstimateStepProps } from '@/components/estimate/types';
import { useTranslation } from '@/hooks/use-translation';
import { focusField } from '@/lib/focus-field';
import { Building, Building2, DoorOpen, Home, Landmark, Layers, type LucideIcon, SquarePlus, Warehouse } from 'lucide-react';

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

type PropertyTypeStepProps = EstimateStepProps & {
    propertyTypes: string[];
};

/** Step 1 — property type as selection cards; picking one moves the focus to the next question. */
export default function PropertyTypeStep({ data, setData, errors, complete, propertyTypes }: PropertyTypeStepProps) {
    const { t } = useTranslation();
    const options: SelectionOption[] = propertyTypes.map((value) => ({
        value,
        label: t(`estimate.property_types.${value}`),
        icon: PROPERTY_ICONS[value] ?? SquarePlus,
    }));

    return (
        <fieldset aria-labelledby="step-type" className="flex flex-col gap-6 pb-10">
            <StepHeading number={1} id="step-type" complete={complete}>
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
                options={options}
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
    );
}
