import { type ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
    alt: string; // required: empty string only for decorative images
    width: number;
    height: number;
    /** Above the fold (LCP candidate)? Loads eagerly with high priority. */
    priority?: boolean;
};

/**
 * <img> with the attributes Core Web Vitals expect: explicit dimensions (no CLS), lazy + async by default.
 * Pass `srcSet` (+ `sizes`, defaults to 100vw) for responsive images — always provide them for content
 * images wider than ~400px on mobile.
 */
export default function SeoImage({ priority = false, loading, decoding, fetchPriority, srcSet, sizes, ...props }: Props) {
    return (
        <img
            loading={loading ?? (priority ? 'eager' : 'lazy')}
            decoding={decoding ?? 'async'}
            fetchPriority={fetchPriority ?? (priority ? 'high' : 'auto')}
            srcSet={srcSet}
            sizes={srcSet ? (sizes ?? '100vw') : sizes}
            {...props}
        />
    );
}
