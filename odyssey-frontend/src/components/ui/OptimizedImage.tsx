import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  objectFit?: 'cover' | 'contain';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  aspectRatio = 'video',
  objectFit = 'cover',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Reset the loading state whenever the source changes.
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setUseFallback(false);
  }, [src]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [src]);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
  };

  const resolvedSrc = useFallback ? fallbackSrc : src;

  const handleError = () => {
    // Fall back to the placeholder first; only show the error state if the
    // placeholder itself cannot be loaded.
    if (!useFallback && fallbackSrc && fallbackSrc !== src) {
      setUseFallback(true);
      setIsLoading(true);
      return;
    }

    setError(true);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center bg-muted',
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <span className="sr-only">Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}

      {isInView && (
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClasses[objectFit],
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          loading="lazy"
          decoding="async"
          {...props}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
