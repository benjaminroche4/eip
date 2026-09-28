/**
 * Placeholder of a property card while the listing loads (filter change or « Voir plus », user decision 2026-09-28):
 * the card's frame with grey blocks in place of the photo, the price band, the title and the facts, pulsing (still
 * under reduced motion). Decorative: the grid announces the load through `aria-busy` on the count.
 */
export default function PropertyCardSkeleton() {
    return (
        <div aria-hidden className="border-border bg-card flex w-full animate-pulse flex-col border p-1.5 motion-reduce:animate-none">
            <div className="bg-background-08 aspect-[4/3] w-full" />
            <div className="bg-background-05 flex flex-col gap-2 px-3 py-3">
                <div className="bg-background-08 h-6 w-2/5" />
                <div className="bg-background-08 h-3 w-3/5" />
            </div>
            <div className="flex flex-col gap-4 p-3 pt-3">
                <div className="flex flex-col gap-2">
                    <div className="bg-background-08 h-3 w-1/4" />
                    <div className="bg-background-08 h-4 w-4/5" />
                </div>
                <div className="border-secondary-30 flex justify-around border-t pt-3">
                    <div className="bg-background-08 h-4 w-10" />
                    <div className="bg-background-08 h-4 w-10" />
                    <div className="bg-background-08 h-4 w-14" />
                </div>
            </div>
        </div>
    );
}
