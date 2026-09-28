import { type Property } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import type { MarkerClusterer } from '@googlemaps/markerclusterer';
import { RefreshCw } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type MapConfig = { key: string | null; mapId: string };

type PropertiesMapProps = {
    properties: Property[];
    /** Slug of the property whose card is hovered / focused (its marker lifts). */
    active: string | null;
    onActivate: (slug: string | null) => void;
    /** A marker was chosen: the page scrolls its card into view. */
    onSelect: (slug: string) => void;
    config: MapConfig;
    /** The viewport refits the shown properties only when this key changes (the server's applied filters), never when « Voir plus » appends a page (2026-09-28). */
    fitKey: string;
    /** Slug of the chosen property: its mini card (`preview`) is anchored **above its chip** and follows the map. */
    selected?: string | null;
    preview?: ReactNode;
    /** « Rechercher dans cette zone » (2026-09-28): the frame the user panned / zoomed to, as [south, west, north, east]. */
    onSearchArea?: (bounds: [number, number, number, number]) => void;
    className?: string;
};

const PARIS = { lat: 48.8566, lng: 2.3522 };
const CALLBACK = '__eipGoogleMapsReady';
const MARKER_BASE = 'relative font-sans tabular-nums transition-colors duration-300 motion-reduce:transition-none';
/** Small pointer under the chip, towards the position. */
const POINTER =
    'after:absolute after:top-full after:left-1/2 after:size-0 after:-translate-x-1/2 after:border-x-[5px] after:border-t-[6px] after:border-x-transparent';

/** Price chip = dark pin: primary background, white price, a small pointer to the exact position (ui.sh « Épingle sombre » chosen among 15, user decision 2026-09-26). Active (card hovered) = sand. */
const MARKER = cn(MARKER_BASE, 'bg-primary text-primary-foreground after:border-t-primary px-2.5 py-1 text-[0.8125rem] font-medium', POINTER);
const MARKER_ACTIVE = 'bg-secondary-60 text-foreground after:border-t-secondary-60';
export const markerClass = (isActive: boolean): string => cn(MARKER, isActive && MARKER_ACTIVE);
/** Cluster chip = the dark chip without its pointer, « 3 biens » (2026-09-28: overlapping prices in the 6e / 7e). */
export const clusterClass = cn(MARKER_BASE, 'bg-primary text-primary-foreground px-2.5 py-1 text-[0.8125rem] font-medium');

let loader: Promise<typeof google> | null = null;

/** Loads the Maps JavaScript API once (script tag, async bootstrap) and resolves with the `google` namespace. */
export function loadGoogleMaps(key: string, language: string): Promise<typeof google> {
    if (typeof window === 'undefined') return new Promise(() => {});
    if (window.google?.maps) return Promise.resolve(window.google);
    loader ??= new Promise((resolve) => {
        (window as unknown as Record<string, () => void>)[CALLBACK] = () => resolve(window.google);
        const params = new URLSearchParams({ key, v: 'weekly', loading: 'async', libraries: 'marker', language, region: 'FR', callback: CALLBACK });
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        script.async = true;
        document.head.append(script);
    });
    return loader;
}

/** Short price for a marker: « 2,4 M€ » / « 890 k€ » for sales, « 6 500 € » / « €6,500 » for monthly rents (`formatPrice`). */
export const shortPrice = (property: Property, locale: string): string => {
    const tag = locale === 'fr' ? 'fr-FR' : 'en-GB';
    if (property.transaction === 'rent') return formatPrice(property.price, locale);
    if (property.price >= 1_000_000) return `${(property.price / 1_000_000).toLocaleString(tag, { maximumFractionDigits: 1 })} M€`;
    return `${Math.round(property.price / 1000)} k€`;
};

/**
 * Google map of the listing (user decision 2026-09-25: a real Google Map instead of the site's vector Paris): loaded
 * after hydration (never at SSR), one **price chip** per property (dark pin with a pointer) as an advanced marker on the building's position, a click opens the mini card (`preview`, portalled into an overlay marker anchored above the chip, so it pans and zooms with the map; the map pans to keep it in view),
 * fitted to the shown properties when the filters change (`fitKey`; « Voir plus » only adds chips, the view stays put,
 * 2026-09-28). Chips too close to read are **clustered** (`@googlemaps/markerclusterer`, loaded with the map) in a
 * dark « N biens » chip; a click zooms into the cluster (2026-09-28). Hover / focus on a chip lifts the matching card, a click scrolls to it; the card's
 * hover lifts the chip back (`active`). Without an API key (local `.env` without `GOOGLE_MAPS_API_KEY`) a sand panel
 * says so instead of a broken map.
 */
export default function PropertiesMap({
    properties,
    active,
    onActivate,
    onSelect,
    config,
    fitKey,
    selected = null,
    preview,
    onSearchArea,
    className,
}: PropertiesMapProps) {
    const { t, tc, locale } = useTranslation();
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<google.maps.Map | null>(null);
    const markers = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>());
    const clusterer = useRef<MarkerClusterer | null>(null);
    const lastFit = useRef<string | null>(null);
    const cluster = (count: number) => tc('properties.cluster', count, { count });
    const handlers = useRef({ onActivate, onSelect, cluster });
    handlers.current = { onActivate, onSelect, cluster };
    // « Rechercher dans cette zone » shows once the user moved the map by hand (a drag, the wheel, the zoom control), never
    // after the page's own refits, and hides again once that frame has been searched (2026-09-28)
    const [moved, setMoved] = useState(false);
    const programmatic = useRef(false);
    const searchArea = () => {
        const bounds = map.current?.getBounds();
        if (!bounds || !onSearchArea) return;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onSearchArea([sw.lat(), sw.lng(), ne.lat(), ne.lng()]);
        setMoved(false);
    };

    useEffect(() => {
        if (!config.key || !container.current) return;
        let cancelled = false;
        loadGoogleMaps(config.key, locale).then(async (g) => {
            if (cancelled || !container.current || map.current) return;
            await g.maps.importLibrary('maps');
            map.current = new g.maps.Map(container.current, {
                center: PARIS,
                zoom: 12,
                mapId: config.mapId,
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'cooperative',
                clickableIcons: false,
                keyboardShortcuts: true,
            });
            // A drag or a zoom by the user offers to search the new frame; the page's fits (`programmatic`) do not
            map.current.addListener('dragend', () => setMoved(true));
            map.current.addListener('zoom_changed', () => {
                if (!programmatic.current) setMoved(true);
            });
            map.current.addListener('idle', () => {
                programmatic.current = false;
            });
            container.current.dispatchEvent(new CustomEvent('map-ready'));
        });
        return () => {
            cancelled = true;
        };
    }, [config.key, config.mapId, locale]);

    // Markers follow the shown properties (one chip each), the viewport fits them
    const slugs = properties.map((p) => p.slug).join(',');
    useEffect(() => {
        const el = container.current;
        if (!el) return;
        const sync = async () => {
            const g = window.google;
            const m = map.current;
            if (!g || !m) return;
            const { AdvancedMarkerElement } = (await g.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
            // The clusterer owns the chips' `map`: it shows a chip alone or folds it into a « N biens » cluster chip
            if (!clusterer.current) {
                const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
                clusterer.current ??= new MarkerClusterer({
                    map: m,
                    renderer: {
                        render: ({ count, position }) => {
                            const content = document.createElement('div');
                            content.className = clusterClass;
                            content.textContent = handlers.current.cluster(count);
                            return new AdvancedMarkerElement({ position, content, title: handlers.current.cluster(count), zIndex: 1000 + count });
                        },
                    },
                });
            }
            const clusters = clusterer.current;
            for (const [slug, marker] of markers.current) {
                if (!properties.some((p) => p.slug === slug)) {
                    clusters.removeMarker(marker, true);
                    markers.current.delete(slug);
                }
            }
            const bounds = new g.maps.LatLngBounds();
            const added: google.maps.marker.AdvancedMarkerElement[] = [];
            for (const property of properties) {
                bounds.extend({ lat: property.lat, lng: property.lng });
                if (markers.current.has(property.slug)) continue;
                const content = document.createElement('div');
                content.className = markerClass(false);
                content.textContent = shortPrice(property, locale);
                const marker = new AdvancedMarkerElement({
                    position: { lat: property.lat, lng: property.lng },
                    content,
                    title: `${property.title}, Paris ${ordinal(property.arrondissement, locale)}, ${shortPrice(property, locale)}`,
                    gmpClickable: true,
                });
                content.addEventListener('pointerenter', () => handlers.current.onActivate(property.slug));
                content.addEventListener('pointerleave', () => handlers.current.onActivate(null));
                marker.addListener('click', () => handlers.current.onSelect(property.slug));
                markers.current.set(property.slug, marker);
                added.push(marker);
            }
            // One render per change (adding re-clusters; a pure removal needs an explicit render)
            if (added.length > 0) clusters.addMarkers(added);
            else clusters.render();
            // Refit only when the applied filters changed (or on the first sync): « Voir plus » must not move the view (2026-09-28)
            if (lastFit.current === fitKey) return;
            lastFit.current = fitKey;
            programmatic.current = true;
            setMoved(false);
            if (properties.length > 1) m.fitBounds(bounds, el.clientHeight < 480 ? 24 : 64);
            else if (properties.length === 1) {
                m.setCenter(bounds.getCenter());
                m.setZoom(14);
            }
        };
        void sync();
        el.addEventListener('map-ready', sync);
        return () => el.removeEventListener('map-ready', sync);
    }, [slugs, properties, locale, fitKey]);

    // The mini card = one more advanced marker at the chosen position, whose content receives the React preview (portal);
    // Google keeps it glued to the chip while panning / zooming (user decision 2026-09-26: above the chip, not docked)
    const overlay = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
    useEffect(() => {
        const property = properties.find((p) => p.slug === selected);
        const g = window.google;
        const m = map.current;
        if (!property || !g || !m) return;
        let cancelled = false;
        (async () => {
            const { AdvancedMarkerElement } = (await g.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
            if (cancelled) return;
            const content = document.createElement('div');
            content.className = 'mb-10 w-80 max-w-[calc(100vw-4rem)]'; // sits above the chip and its pointer
            const position = { lat: property.lat, lng: property.lng };
            overlay.current = new AdvancedMarkerElement({ map: m, position, content, zIndex: 10, gmpClickable: true });
            setOverlayEl(content);
            programmatic.current = true;
            m.panTo(position);
            m.panBy(0, -120);
        })();
        return () => {
            cancelled = true;
            if (overlay.current) overlay.current.map = null;
            overlay.current = null;
            setOverlayEl(null);
        };
    }, [selected, properties]);

    useEffect(() => {
        for (const [slug, marker] of markers.current) {
            const chip = marker.content as HTMLElement | null;
            if (!chip) continue;
            // Sand while its card is hovered or while its mini card is open (user decision 2026-09-26)
            const lit = slug === active || slug === selected;
            chip.className = markerClass(lit);
            marker.zIndex = lit ? 1 : 0;
        }
    }, [active, selected]);

    return (
        // Boxed like the property cards: same border and `p-1.5` inset (user decision 2026-09-26)
        <div
            role="region"
            aria-label={t('properties.map_label')}
            className={cn('border-border bg-card relative isolate flex flex-col border p-1.5', className)}
        >
            {config.key ? <div ref={container} className="bg-background-05 h-full min-h-0 w-full flex-1 overflow-hidden" /> : null}
            {/* Search the frame the user framed (2026-09-28): white square button over the map, top centre, until it is searched */}
            {config.key && moved && onSearchArea && (
                <div className="animate-fade-in absolute inset-x-0 top-3 z-10 flex justify-center motion-reduce:animate-none">
                    <Button type="button" variant="outline" size="sm" onClick={searchArea} className="bg-card">
                        <RefreshCw aria-hidden className="size-3.5" />
                        {t('properties.search_area')}
                    </Button>
                </div>
            )}
            {!config.key && (
                <p className="text-muted-foreground bg-background-05 flex h-full flex-1 items-center justify-center p-6 text-center text-sm text-pretty">
                    {t('properties.map_missing')}
                </p>
            )}
            {overlayEl && preview && createPortal(preview, overlayEl)}
        </div>
    );
}
