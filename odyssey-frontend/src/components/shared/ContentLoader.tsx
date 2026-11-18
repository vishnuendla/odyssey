import { Icons } from '@/components/shared/Icons';
import { cn } from '@/lib/utils';

type ContentLoaderProps = {
  label?: string;
  className?: string;
};

/**
 * Quiet placeholder for a list that has no data yet.
 *
 * It deliberately does not imitate a journal card: fake covers and titles
 * appearing for a frame and then vanishing reads as a broken page, especially
 * on listings that hold only one or two entries. The reserved height keeps the
 * layout from jumping when the real content lands.
 */
export default function ContentLoader({ label = 'Loading…', className }: ContentLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[16rem] flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
        className
      )}
    >
      <Icons.spinner className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
