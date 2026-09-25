import RingsBackdrop from '@/components/page/rings-backdrop';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { scrollBehavior } from '@/lib/focus-field';
import { linkClass } from '@/lib/hover-surface';
import { PARIS_ARRONDISSEMENTS, PARIS_BOIS, PARIS_OUTLINE, PARIS_SEINE, PARIS_VIEWBOX } from '@/lib/paris-arrondissements';
import { cn } from '@/lib/utils';
import { Pointer, ZoomIn, ZoomOut } from 'lucide-react';
import { type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useId, useRef, useState } from 'react';

export type District = {
    n: number;
    name: string;
    areas: string;
    profile: string;
    price: string;
    extra: string;
    positives: string[];
    audience: string;
    housing: string;
    /** Detailed profile (2026-09-25): summary, metro / RER line ids, railway stations, sights, food, green spaces, schools. */
    summary: string;
    metro: string[];
    rer: string[];
    stations: string[];
    attractions: string[];
    dining: string[];
    parks: string[];
    education: string[];
};

type ParisMapProps = {
    items: District[];
    /** Selected arrondissement (click / tap / Enter): drives the detail panel under the map. */
    selected: number | null;
    onSelect: (n: number | null) => void;
    /** Layout override of the root (default: centred, `max-w-4xl`). */
    className?: string;
};

/** « 14 500 » → 14500 (the price strings keep their locale grouping). */
const priceValue = (price: string) => Number(price.replace(/[^\d]/g, '')) || 0;

/** Shared width transition of the gauge fill: 700 ms on the site's expo-out curve, in and out. */
const fillEase = 'transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none';
/** Heights of the eight steps of the gauge, 1/8 to 8/8 (full class names so Tailwind keeps them). */
const STEP_HEIGHTS = ['h-1/8', 'h-2/8', 'h-3/8', 'h-4/8', 'h-5/8', 'h-6/8', 'h-7/8', 'h-full'] as const;
const BANDS = STEP_HEIGHTS.length;
/** Arrow keys of the roving tabindex: right / down = next arrondissement, left / up = previous (wrapping 20 → 1). */
const ARROW_STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
const COUNT = PARIS_ARRONDISSEMENTS.length;

/** Number label offsets (viewBox units): the 16e's official centroid falls inside the hatched Bois de Boulogne, so its
 *  number is pushed east onto the built-up part (user decision 2026-09-25). The generated centroids stay untouched. */
const NUMBER_DX: Partial<Record<number, number>> = { 16: 60 };
const numberX = (shape: { n: number; cx: number }) => shape.cx + (NUMBER_DX[shape.n] ?? 0);

/** The 6e (the agency's own arrondissement) lifts by itself once, 1.4 s after mount (after the 20 × 40 ms reveal cascade), for 1 s. */
const DEMO_ARRONDISSEMENT = 6;
const DEMO_AT_MS = 1400;
const DEMO_FOR_MS = 1000;

const MAX_AREA = Math.max(...PARIS_ARRONDISSEMENTS.map((s) => s.area));
/** Number size by arrondissement area: the tiny central ones (1er-4e) get a small figure, the outer ones a large one. */
const numberSize = (area: number) => (area < MAX_AREA * 0.12 ? 'text-[1.1rem]' : area < MAX_AREA * 0.35 ? 'text-[1.5rem]' : 'text-[1.9rem]');

/**
 * Interactive map of Paris (2026-09-22, refined the same day — user decision « fais tout »): the 20 arrondissements
 * as SVG paths (real shapes from the City's open data, `lib/paris-arrondissements.ts`), each a focusable button, on a
 * sand well with air around it — a blurred, desaturated Paris façade under a sand veil (`hero-800.jpg`, decorative) —
 * animated by the site's concentric rings (`RingsBackdrop`) turning and breathing above the veil,
 * and tilted back 12° in 3D (6° while the pointer is over the well) with a faked thickness under the city. Below lg
 * the map zooms (three levels, + / − buttons and pinch) inside a scrollable, flat plane so the small central
 * arrondissements can be tapped (user decision 2026-09-23).
 * - Paper-cut contour: the city's outer silhouette (`PARIS_OUTLINE`) as a dark sand hairline over the map, doubled by
 *   a lighter copy offset by 3px underneath — no shadow, the site's rule.
 * - Price gradient: sand fill with an opacity proportional to the price per m²; the legend under the map reads
 *   « plus abordable → plus recherché » and doubles as a gauge (`--progress`) to the active arrondissement.
 * - Numbers sized by area (`font-medium`, three tiers) so the small central arrondissements stay legible.
 * - Hover (or keyboard focus) = levitation: the piece turns deep sand (`secondary-80`, white number — user decision 2026-09-22), rises 8px and grows
 *   4 % while a dark-sand copy left in place reveals its thickness — drawn as an overlay above every neighbour (the
 *   interactive piece keeps its DOM place, so the tab order never changes), its number rising with it in semibold; the
 *   others dim; the selected one keeps a thick sand outline while another is hovered.
 * - Selection (click, tap, Enter, Space — a second one clears; focus never selects, a mouse click also focuses). The
 *   ring emitted on selection was tried and removed the same day (user decision 2026-09-22).
 * - Tooltip following the cursor (desktop, mouse / pen only, `aria-hidden`): name and price.
 * - The Seine as a white ribbon over a wider sand bank; the two bois hatched (the landmark monuments and their
 *   labels were built then removed the same day — user decision 2026-09-22) (a 3D relief on the numbers was tried and
 *   removed the same day); the Seine as a white ribbon over a wider sand bank; the two bois hatched.
 * - Reveal: the arrondissements rise in cascade on load (`animate-hero-rise`, `--stagger` 40 ms); then, once, the 6e
 *   lifts alone for a second as a hint that the map answers (skipped under reduced motion, cancelled by interaction).
 * - UX round of 2026-09-25 (user decision): roving tabindex (one Tab stop, arrows, Home / End, Escape) with a dark
 *   focus ring on the lifted twin; the legend's steps are buttons for a price band that fade the others (hover / focus,
 *   click pins); a summary with a link to the sheet below lg. (A profile filter above the map was built then removed
 *   the same day, user decision.)
 * The detail panel under the map (page) is the accessible, keyboard and touch surface for the content.
 */
export default function ParisMap({ items, selected, onSelect, className }: ParisMapProps) {
    const { t, tc } = useTranslation();
    const hatchId = useId();
    const keyboardHintId = useId();
    const [hovered, setHovered] = useState<number | null>(null);
    // Touch never hovers (2026-09-25): on iOS a tap first emulates a hover, and when that hover changes the DOM (the
    // lifted twin) the click is swallowed — a second arrondissement could not be selected. A finger only selects;
    // the focus a tap may give the piece is ignored too (`lastPointer`), the keyboard focus still lights it.
    const lastPointer = useRef<string>('keyboard');
    // Roving tabindex (2026-09-25): one Tab stop for the whole map (the selected piece, else the last focused, else
    // the 1er), arrows move between arrondissements, Home / End jump, Escape clears the selection. A keyboard focus
    // draws a dark ring on the lifted twin (the piece in the loop is transparent while lit, so a CSS outline on it
    // would be invisible — that ring is the visible focus the site's rule asks for).
    const [roving, setRoving] = useState<number | null>(null);
    const [keyboard, setKeyboard] = useState(false);
    const tabStop = roving ?? selected ?? 1;
    const pathRefs = useRef(new Map<number, SVGPathElement>());
    const focusShape = (n: number) => {
        lastPointer.current = 'keyboard';
        pathRefs.current.get(((n - 1 + COUNT) % COUNT) + 1)?.focus();
    };
    const onShapeKeyDown = (e: KeyboardEvent<SVGPathElement>, n: number, isSelected: boolean) => {
        const step = ARROW_STEP[e.key];
        if (step !== undefined) {
            e.preventDefault();
            focusShape(n + step);
        } else if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            focusShape(e.key === 'Home' ? 1 : COUNT);
        } else if (e.key === 'Escape' && selected !== null) {
            e.preventDefault();
            onSelect(null);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(isSelected ? null : n);
        }
    };
    const onShapeFocus = (el: SVGPathElement, n: number) => {
        setRoving(n);
        if (lastPointer.current === 'touch') return;
        setHovered(n);
        let visible = lastPointer.current === 'keyboard';
        try {
            visible ||= el.matches(':focus-visible');
        } catch {
            // engines without :focus-visible: the last input kind alone decides
        }
        setKeyboard(visible);
    };
    // Demonstration on load (user decision 2026-09-23): once the reveal cascade is over, the 6e lifts alone for a
    // second and settles, one time only — skipped under prefers-reduced-motion and cancelled by any interaction.
    const [demo, setDemo] = useState<number | null>(null);
    const interacted = useRef(false);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const lift = window.setTimeout(() => {
            if (!interacted.current) setDemo(DEMO_ARRONDISSEMENT);
        }, DEMO_AT_MS);
        const settle = window.setTimeout(() => setDemo(null), DEMO_AT_MS + DEMO_FOR_MS);
        return () => {
            window.clearTimeout(lift);
            window.clearTimeout(settle);
        };
    }, []);
    useEffect(() => {
        if (hovered !== null || selected !== null) {
            interacted.current = true;
            setDemo(null);
        }
    }, [hovered, selected]);
    const active = hovered ?? selected ?? demo;
    const byNumber = new Map(items.map((d) => [d.n, d]));
    const current = active === null ? null : (byNumber.get(active) ?? null);
    const activeShape = PARIS_ARRONDISSEMENTS.find((shape) => shape.n === active);
    const prices = items.map((d) => priceValue(d.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    /** 0.2 → 1: the cheapest arrondissement stays readable, the dearest is full sand. */
    const shade = (n: number) => {
        const d = byNumber.get(n);
        if (!d || max === min) return 0.6;
        return 0.2 + 0.8 * ((priceValue(d.price) - min) / (max - min));
    };

    // Interactive legend (2026-09-25): each step of the gauge is a button for a price band; hovering or focusing it
    // fades every arrondissement outside the band, a click / tap pins it (a second one releases).
    const bandOf = (n: number) => Math.min(BANDS - 1, Math.floor(((shade(n) - 0.2) / 0.8) * BANDS));
    const [hoverBand, setHoverBand] = useState<number | null>(null);
    const [pinnedBand, setPinnedBand] = useState<number | null>(null);
    const band = hoverBand ?? pinnedBand;
    const bandPrice = (i: number) => Math.round(min + ((max - min) * i) / BANDS);
    /** Groups the thousands like the localized price strings do (« 14 500 » in French, « 14,500 » in English). */
    const separator = items[0]?.price.replace(/\d/g, '')[0] ?? ' ';
    const group = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    const bandCount = (i: number) => items.filter((d) => bandOf(d.n) === i).length;

    /** Faded by the legend band (stronger than the hover dimming). */
    const muted = (n: number) => band !== null && bandOf(n) !== band;

    // Mobile summary under the map: the selected arrondissement's name and price with a link to its sheet (the sheet
    // sits under the hero, out of view when tapping — 2026-09-25)
    const selectedDistrict = selected === null ? null : (byNumber.get(selected) ?? null);
    const scrollToSheet = (e: MouseEvent<HTMLAnchorElement>) => {
        const target = document.getElementById(`arrondissement-${selected}`);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    };

    // Cursor tooltip (desktop): position kept in CSS variables on the wrapper, hidden as soon as the pointer leaves
    const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
    const wellRef = useRef<HTMLDivElement>(null);

    // Mobile zoom (user decision 2026-09-23: the small central arrondissements are not tappable at 100 %): three
    // levels, + / − buttons below lg and a two-finger pinch on the scroll container; the plane is flat and scrollable
    // while zoomed, recentred at each level change.
    const LEVELS = ['w-full', 'w-[175%]', 'w-[250%]'];
    const [zoom, setZoom] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pinch = useRef<{ pointers: Map<number, { x: number; y: number }>; start: number | null }>({ pointers: new Map(), start: null });
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }, [zoom]);
    const distance = () => {
        const [a, b] = [...pinch.current.pointers.values()];
        return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null;
    };
    const onPinchDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== 'touch') return;
        pinch.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch.current.pointers.size === 2) pinch.current.start = distance();
    };
    const onPinchMove = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== 'touch' || !pinch.current.pointers.has(e.pointerId)) return;
        pinch.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const d = distance();
        const start = pinch.current.start;
        if (d === null || start === null) return;
        if (d / start > 1.3) {
            setZoom((z) => Math.min(z + 1, LEVELS.length - 1));
            pinch.current.start = d;
        } else if (d / start < 0.75) {
            setZoom((z) => Math.max(z - 1, 0));
            pinch.current.start = d;
        }
    };
    const onPinchEnd = (e: PointerEvent<HTMLDivElement>) => {
        pinch.current.pointers.delete(e.pointerId);
        if (pinch.current.pointers.size < 2) pinch.current.start = null;
    };
    const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
        if (e.pointerType === 'touch') return;
        const rect = (wellRef.current ?? e.currentTarget).getBoundingClientRect(); // the well: the svg itself is tilted in 3D
        setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const pct = current ? Math.round(shade(current.n) * 100) : 0;

    return (
        <div className={cn('mx-auto flex w-full max-w-4xl flex-col gap-4', className)}>
            <p id={keyboardHintId} className="sr-only">
                {t('districts.keyboard_hint')}
            </p>
            {/* Sand well under the map (square corners, air around; edge to edge below lg like the other photo panels — user decision 2026-09-23), animated by the site's concentric rings turning and
                breathing behind the map (`RingsBackdrop`, shared with the CTA card — user decision 2026-09-22) */}
            <div
                ref={wellRef}
                className="bg-background-05 group relative isolate -mx-6 overflow-hidden p-4 [perspective:1600px] sm:p-8 lg:mx-0"
                style={tip ? ({ '--tip-x': `${tip.x}px`, '--tip-y': `${tip.y}px` } as CSSProperties) : undefined}
            >
                {/* Blurred Paris under a sand veil (user decision 2026-09-22): the home hero façade at 800px, blurred, desaturated,
                    scaled so the blur never shows an edge; decorative, lazy. The rings turn above the veil. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
                    <img
                        src="/images/home/hero-800.jpg"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full scale-110 object-cover opacity-70 blur-2xl saturate-50"
                    />
                    <div className="bg-background-05/70 absolute inset-0" />
                </div>
                <RingsBackdrop className="size-[72rem]" />
                {/* Slight 3D: the map plane is tilted back 12° and straightens to 6° while the pointer is over the well (user
                    decision 2026-09-22); the thickness is faked by an offset dark-sand copy of the city under a white base */}
                <div
                    ref={scrollRef}
                    onPointerDown={onPinchDown}
                    onPointerMove={onPinchMove}
                    onPointerUp={onPinchEnd}
                    onPointerCancel={onPinchEnd}
                    className={cn(
                        // `touch-pan-y` at 100 %: the page still scrolls over the map, but two fingers are ours (a browser pinch
                        // would cancel the pointer events before the level changed — bug 2026-09-25)
                        'relative touch-pan-y',
                        zoom > 0 && 'touch-pan-x overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                    )}
                >
                    <div
                        className={cn(
                            'relative origin-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] motion-reduce:[transform:none] motion-reduce:transition-none',
                            zoom === 0 ? '[transform:rotateX(12deg)] group-hover:[transform:rotateX(6deg)]' : LEVELS[zoom],
                        )}
                    >
                        <svg
                            viewBox={`-6 -6 ${PARIS_VIEWBOX.width + 12} ${PARIS_VIEWBOX.height + 12}`}
                            role="group"
                            aria-label={t('districts.map_label')}
                            aria-describedby={keyboardHintId}
                            className="relative w-full select-none"
                            onPointerMove={onPointerMove}
                            onPointerLeave={() => setTip(null)}
                        >
                            <defs>
                                {/* Thin diagonal hairlines for the two bois */}
                                <pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                    <line x1="0" y1="0" x2="0" y2="8" className="stroke-secondary-50" strokeWidth="1" />
                                </pattern>
                            </defs>
                            {/* Paper-cut: the lighter offset copy of the contour, under everything */}
                            <path
                                d={PARIS_OUTLINE}
                                fill="none"
                                className="stroke-secondary-50 pointer-events-none"
                                strokeWidth="1.5"
                                transform="translate(3 3)"
                            />
                            {/* Thickness of the tilted plane: an opaque dark-sand copy of the city pushed 8px down, then a white base so the
                        semi-transparent sand fills above never show it through — only the bottom edge remains visible */}
                            <g aria-hidden className="pointer-events-none">
                                <path d={PARIS_OUTLINE} className="fill-secondary-80" transform="translate(0 8)" />
                                <path d={PARIS_OUTLINE} className="fill-card" />
                            </g>
                            {PARIS_ARRONDISSEMENTS.map((shape, i) => {
                                const district = byNumber.get(shape.n);
                                const isActive = active === shape.n;
                                const isSelected = selected === shape.n;
                                const dimmed = active !== null && !isActive && !isSelected;
                                return (
                                    <g
                                        key={shape.n}
                                        style={{ '--stagger': `${i * 40}ms` } as CSSProperties}
                                        className="animate-hero-rise [animation-delay:var(--stagger)] motion-reduce:animate-none"
                                    >
                                        {/* The interactive piece stays in DOM order (tab order); while active it turns transparent and its lifted
                                        twin is drawn in the overlay after the loop, above every neighbour */}
                                        <path
                                            ref={(el) => {
                                                if (el) pathRefs.current.set(shape.n, el);
                                                else pathRefs.current.delete(shape.n);
                                            }}
                                            d={shape.d}
                                            role="button"
                                            tabIndex={tabStop === shape.n ? 0 : -1}
                                            aria-pressed={isSelected}
                                            aria-label={
                                                district ? `${district.name} : ${district.areas}, ${district.price} €/m²` : `Paris ${shape.n}`
                                            }
                                            fillOpacity={shade(shape.n)}
                                            onPointerDown={(e) => (lastPointer.current = e.pointerType)}
                                            onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(shape.n)}
                                            onPointerLeave={(e) => e.pointerType !== 'touch' && setHovered(null)}
                                            onFocus={(e) => onShapeFocus(e.currentTarget, shape.n)}
                                            onBlur={() => {
                                                setHovered(null);
                                                setKeyboard(false);
                                            }}
                                            onClick={() => onSelect(isSelected ? null : shape.n)}
                                            onKeyDown={(e) => onShapeKeyDown(e, shape.n, isSelected)}
                                            className={cn(
                                                // no CSS outline: the keyboard focus ring is drawn on the lifted twin in the overlay
                                                'cursor-pointer transition-[opacity,stroke-width,stroke] duration-300 outline-none motion-reduce:transition-none',
                                                isSelected
                                                    ? 'fill-secondary-60 stroke-secondary-80 stroke-[4]'
                                                    : 'fill-secondary-60 stroke-card stroke-2',
                                                dimmed && 'opacity-60',
                                                muted(shape.n) && 'opacity-25',
                                                isActive && 'opacity-0',
                                            )}
                                        />
                                        <text
                                            x={numberX(shape)}
                                            y={shape.cy}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            aria-hidden
                                            className={cn(
                                                'font-heading fill-foreground pointer-events-none font-medium transition-opacity duration-300 motion-reduce:transition-none',
                                                numberSize(shape.area),
                                                dimmed && 'opacity-60',
                                                muted(shape.n) && 'opacity-25',
                                                isActive && 'opacity-0',
                                            )}
                                        >
                                            {shape.n}
                                        </text>
                                    </g>
                                );
                            })}
                            {/* Contour over the map, then the landmarks (revealed after the cascade) */}
                            <path
                                d={PARIS_OUTLINE}
                                fill="none"
                                className="stroke-secondary-80 pointer-events-none"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                            <g aria-hidden className="animate-fade-in pointer-events-none [animation-delay:900ms] motion-reduce:animate-none">
                                {PARIS_BOIS.map((d) => (
                                    <path key={d} d={d} fill={`url(#${hatchId})`} className="stroke-secondary-50" strokeWidth="1" />
                                ))}
                                {/* The Seine: a wide sand bank under the white ribbon */}
                                {PARIS_SEINE.map((d) => (
                                    <path
                                        key={`bank-${d}`}
                                        d={d}
                                        fill="none"
                                        className="stroke-secondary-30"
                                        strokeWidth="13"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                                {PARIS_SEINE.map((d) => (
                                    <path
                                        key={d}
                                        d={d}
                                        fill="none"
                                        className="stroke-card"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                ))}
                            </g>
                            {/* Levitation overlay, last in the SVG: the active arrondissement drawn again above every neighbour, the Seine, the bois and the contour (thickness, lifted piece, number — user decision 2026-09-25) */}
                            {activeShape && (
                                <g
                                    key={activeShape.n}
                                    aria-hidden
                                    className="animate-hero-rise pointer-events-none [animation-duration:400ms] motion-reduce:animate-none"
                                >
                                    <path d={activeShape.d} transform="translate(0 6)" className="fill-primary opacity-30" />
                                    <path
                                        d={activeShape.d}
                                        className={cn(
                                            'fill-secondary-80 origin-center -translate-y-2 scale-[1.04] [transform-box:fill-box]',
                                            // keyboard focus: the dark ring replaces the white edge (the visible focus of the map)
                                            keyboard && hovered === activeShape.n ? 'stroke-primary stroke-[4]' : 'stroke-card stroke-[3]',
                                        )}
                                    />
                                    <text
                                        x={numberX(activeShape)}
                                        y={activeShape.cy - 8}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        className={cn('font-heading fill-primary-foreground font-semibold', numberSize(activeShape.area))}
                                    >
                                        {activeShape.n}
                                    </text>
                                </g>
                            )}
                        </svg>
                    </div>
                </div>
                {/* Zoom, below lg only: the small central arrondissements need it to be tappable */}
                <div className="absolute top-3 right-3 flex gap-2 lg:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-card"
                        aria-label={t('districts.zoom_out')}
                        disabled={zoom === 0}
                        onClick={() => setZoom((z) => Math.max(z - 1, 0))}
                    >
                        <ZoomOut aria-hidden />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="bg-card"
                        aria-label={t('districts.zoom_in')}
                        disabled={zoom === LEVELS.length - 1}
                        onClick={() => setZoom((z) => Math.min(z + 1, LEVELS.length - 1))}
                    >
                        <ZoomIn aria-hidden />
                    </Button>
                </div>
                {/* Cursor tooltip, desktop only, decorative (the panel under the map carries the accessible content) */}
                {tip && current && (
                    <div
                        aria-hidden
                        className="border-secondary-30 bg-card pointer-events-none absolute top-[var(--tip-y)] left-[var(--tip-x)] hidden -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] border px-3 py-2 text-xs whitespace-nowrap lg:block"
                    >
                        <span className="font-medium">{current.name}</span>
                        <span className="text-muted-foreground"> · {current.price} €/m²</span>
                    </div>
                )}
            </div>
            {/* Legend of the price gradient, doubling as a gauge: the dark fill grows (and recedes) smoothly to the active
                arrondissement's position between the cheapest and the dearest (`--progress`). ui.sh variant « Surtitre » chosen
                among 21 on 2026-09-25; hint in a lighter grey (grey-40) with a pointer icon (works for touch and mouse) (user decision the same day). */}
            {/* Mobile summary (below lg, where there is no cursor tooltip and the sheet sits out of view): the selected
                arrondissement's name and price, and a link that scrolls to its sheet */}
            <div className="border-secondary-30 bg-card flex min-h-11 items-center justify-between gap-3 border px-3 py-2 text-xs lg:hidden">
                {selectedDistrict ? (
                    <>
                        <span className="tabular-nums">
                            <span className="font-medium">{selectedDistrict.name}</span>
                            <span className="text-muted-foreground"> · {selectedDistrict.price} €/m²</span>
                        </span>
                        <a href={`#arrondissement-${selectedDistrict.n}`} onClick={scrollToSheet} className={cn(linkClass, 'shrink-0 font-medium')}>
                            {t('districts.see_profile')}
                        </a>
                    </>
                ) : (
                    <span className="text-muted-foreground">{t('districts.card_placeholder')}</span>
                )}
            </div>
            <div className="flex flex-col items-center gap-2" style={{ '--progress': `${pct}%` } as CSSProperties}>
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('districts.price_label')}</p>
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span>{t('districts.legend_low')}</span>
                    {/* « Marches » (ui.sh style chosen among 21 on 2026-09-25): eight rising sand steps, the dark copy on top
                        is clipped to `--progress` so the steps light up one by one as the price climbs. Each step is a
                        button for its price band (24px tall hit area, the visual sits at the bottom). */}
                    <span className="relative w-52 sm:w-64">
                        <div role="group" aria-label={t('districts.legend')} className="flex h-6 items-end gap-0.5">
                            {STEP_HEIGHTS.map((h, i) => (
                                <button
                                    key={h}
                                    type="button"
                                    aria-pressed={pinnedBand === i}
                                    aria-label={tc('districts.legend_band', bandCount(i), {
                                        from: group(bandPrice(i)),
                                        to: group(bandPrice(i + 1)),
                                        count: bandCount(i),
                                    })}
                                    onPointerEnter={(e) => e.pointerType !== 'touch' && setHoverBand(i)}
                                    onPointerLeave={(e) => e.pointerType !== 'touch' && setHoverBand(null)}
                                    onFocus={() => setHoverBand(i)}
                                    onBlur={() => setHoverBand(null)}
                                    onClick={() => setPinnedBand((p) => (p === i ? null : i))}
                                    className="focus-ring flex h-full flex-1 items-end"
                                >
                                    {/* 12px visual box at the bottom of the 24px hit area: same scale as the dark copy */}
                                    <span aria-hidden className="flex h-3 w-full items-end">
                                        <span
                                            className={cn(
                                                'w-full transition-colors duration-300 motion-reduce:transition-none',
                                                h,
                                                band === i ? 'bg-secondary-80' : 'bg-secondary-30',
                                            )}
                                        />
                                    </span>
                                </button>
                            ))}
                        </div>
                        <span
                            aria-hidden
                            className={cn('pointer-events-none absolute bottom-0 left-0 h-3 w-[var(--progress)] overflow-hidden', fillEase)}
                        >
                            <span className="absolute inset-y-0 left-0 flex w-52 items-end gap-0.5 sm:w-64">
                                {STEP_HEIGHTS.map((h) => (
                                    <span key={h} className={cn('bg-primary flex-1', h)} />
                                ))}
                            </span>
                        </span>
                    </span>
                    <span>{t('districts.legend_high')}</span>
                    {current && (
                        <span role="status" className="sr-only">
                            {t('districts.gauge', { name: current.name, price: current.price })}
                        </span>
                    )}
                </div>
                {/* The hint fades out as soon as the map is hovered or an arrondissement is selected (user decision 2026-09-25),
                    keeping its line so nothing shifts */}
                <p
                    className={cn(
                        'text-grey-40 flex items-center justify-center gap-2 text-center text-xs transition-opacity duration-300 motion-reduce:transition-none',
                        (hovered !== null || selected !== null) && 'opacity-0',
                    )}
                >
                    <Pointer aria-hidden className="size-3.5 shrink-0" />
                    {t('districts.hint')}
                </p>
            </div>
        </div>
    );
}
