import React, { useState, useEffect } from 'react';
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
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio = 'video',
  objectFit = 'cover',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
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

    const imgElement = document.getElementById(`img-${src}`);
    if (imgElement) {
      observer.observe(imgElement);
    }

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
      id={`img-${src}`}
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
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClasses[objectFit],
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default OptimizedImage; 