'use client';

interface PhotoProps {
    src: string;
    alt: string;
    className?: string;
}

/**
 * External photo (Unsplash, or a URL an admin typed in Gym info). Plain <img> because
 * next/image needs every domain whitelisted up front. If the URL fails the image hides
 * itself, so put a gradient / color on the parent as the fallback.
 */
export default function Photo({ src, alt, className = '' }: PhotoProps) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading="lazy"
            className={className}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
    );
}
