import { useState, type ReactNode } from "react";

/**
 * An image that swaps to `fallback` when it is missing or fails to load,
 * so a lost file shows a tidy placeholder instead of a broken-image box.
 */
export default function CoverImage({
  src,
  alt,
  className,
  loading,
  fallback = null,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fallback?: ReactNode;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} loading={loading} onError={() => setFailedSrc(src)} />;
}
