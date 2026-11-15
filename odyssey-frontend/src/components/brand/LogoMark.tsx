import { cn } from '@/lib/utils';

/**
 * Odyssey brand mark: a compass rose drawn for the product — a bezel with
 * north/south/east/west ticks and a two-tone needle whose tip carries the
 * adventure-orange accent. Stroke presentation for the interface chrome.
 */
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('text-primary', className)}
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 1.25v2M22.75 12h-2M12 22.75v-2M1.25 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Needle: orange pointed half to the north-east, navy tail. */}
      <path d="M16.24 7.76 14.12 14.12 9.88 9.88Z" fill="currentColor" className="text-accent" />
      <path d="M7.76 16.24 14.12 14.12 9.88 9.88Z" fill="currentColor" />
    </svg>
  );
}
