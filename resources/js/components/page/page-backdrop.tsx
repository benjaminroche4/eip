/**
 * Decorative Haussmann façade drawn with 1px hairlines (mansard roof with dormers, double cornice, running balcony,
 * window rhythm), sitting behind the top of every public page without a hero (PublicLayout). Static, stroke-only,
 * very low contrast and faded on its edges (`backdrop-fade`, app.css) so it reads as a watermark, not a wallpaper.
 * Hidden from assistive tech and from small screens.
 */
export default function PageBackdrop() {
    return (
        <div aria-hidden className="backdrop-fade pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-96 overflow-hidden opacity-20 sm:block">
            <svg
                viewBox="0 0 1440 384"
                preserveAspectRatio="xMidYMin slice"
                className="text-border h-full w-full"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
            >
                <defs>
                    {/* One bay every 192px: tall French window with its transom and a stone sill */}
                    <pattern id="bay" width="192" height="128" patternUnits="userSpaceOnUse">
                        <rect x="74" y="28" width="44" height="76" />
                        <line x1="96" y1="28" x2="96" y2="104" />
                        <line x1="74" y1="56" x2="118" y2="56" />
                        <line x1="66" y1="104" x2="126" y2="104" />
                    </pattern>
                    <pattern id="railing" width="8" height="12" patternUnits="userSpaceOnUse">
                        <line x1="4" y1="0" x2="4" y2="12" />
                    </pattern>
                    <pattern id="dormer" width="192" height="72" patternUnits="userSpaceOnUse">
                        <path d="M82 72 V40 A14 14 0 0 1 110 40 V72" />
                        <line x1="96" y1="40" x2="96" y2="72" />
                    </pattern>
                </defs>

                {/* Mansard roof + dormers */}
                <line x1="0" y1="8" x2="1440" y2="8" />
                <rect x="0" y="8" width="1440" height="72" fill="url(#dormer)" stroke="none" />
                {/* Double cornice */}
                <line x1="0" y1="80" x2="1440" y2="80" />
                <line x1="0" y1="88" x2="1440" y2="88" />
                {/* Top floor */}
                <rect x="0" y="88" width="1440" height="128" fill="url(#bay)" stroke="none" />
                {/* Running balcony */}
                <rect x="0" y="204" width="1440" height="12" fill="url(#railing)" stroke="none" />
                <line x1="0" y1="216" x2="1440" y2="216" />
                {/* Second floor, fading into the page */}
                <rect x="0" y="216" width="1440" height="128" fill="url(#bay)" stroke="none" />
                <line x1="0" y1="344" x2="1440" y2="344" />
            </svg>
        </div>
    );
}
