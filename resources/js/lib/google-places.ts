/**
 * Loads the Google Maps JS API (places library) on demand, once, client-side only.
 * The script is injected on the first call (the address field's first focus), never at page load.
 */
let placesLibrary: Promise<google.maps.PlacesLibrary | null> | null = null;

export function loadPlaces(apiKey: string, language: string): Promise<google.maps.PlacesLibrary | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);

    placesLibrary ??= injectScript(apiKey, language)
        .then(() => window.google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>)
        .catch(() => {
            placesLibrary = null; // a network hiccup should not disable suggestions for the whole visit

            return null;
        });

    return placesLibrary;
}

function injectScript(apiKey: string, language: string): Promise<void> {
    if (typeof (window as { google?: typeof google }).google?.maps?.importLibrary === 'function') return Promise.resolve();

    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({ key: apiKey, v: 'weekly', loading: 'async', language, region: 'FR' });
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Maps failed to load'));
        document.head.append(script);
    });
}
