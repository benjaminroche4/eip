import { cn } from '@/lib/utils';

type ErrorCodeProps = { code: string; className?: string };

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 240;

/**
 * Giant status code drawn as a dashed sand outline behind the error message (Figma 708-15580).
 * Decorative only — SVG text so the dashed stroke scales cleanly (CSS text-stroke cannot be dashed).
 * Each digit is anchored on its own x position, so the composition holds whatever the font metrics;
 * `non-scaling-stroke` keeps the hairline and dashes identical at every viewport width.
 */
export default function ErrorCode({ code, className }: ErrorCodeProps) {
    const digits = code.split('');
    const middle = Math.floor(digits.length / 2);
    const slot = VIEW_WIDTH / (digits.length + 1);

    return (
        <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            aria-hidden
            className={cn('text-secondary-50 pointer-events-none w-full select-none', className)}
        >
            <text
                y={VIEW_HEIGHT / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
                fontSize="205"
                className="font-heading font-bold"
            >
                {digits.map((digit, index) => (
                    <tspan key={index} x={slot * (index + 1)} fontStyle={index === middle ? 'italic' : undefined}>
                        {digit}
                    </tspan>
                ))}
            </text>
        </svg>
    );
}
