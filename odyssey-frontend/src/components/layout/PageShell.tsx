import { cn } from '@/lib/utils';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, main stretches with a subtle top wash for marketing pages. */
  hero?: boolean;
};

export default function PageShell({ children, className, hero }: PageShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background', hero && 'page-hero-wash', className)}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}