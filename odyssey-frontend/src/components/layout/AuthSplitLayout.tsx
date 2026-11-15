import LogoMark from '@/components/brand/LogoMark';
import { cn } from '@/lib/utils';

type AuthSplitLayoutProps = {
  title: string;
  subtitle: string;
  features: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }[];
  children: React.ReactNode;
  footerNote?: string;
};

export default function AuthSplitLayout({
  title,
  subtitle,
  features,
  children,
  footerNote = 'Odyssey — travel journals built for the long way round.',
}: AuthSplitLayoutProps) {
  return (
    <div className="w-full max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_26.5rem] lg:items-stretch lg:gap-14 xl:gap-16">
      <aside
        aria-hidden="true"
        className="auth-marketing-panel hidden lg:flex"
      >
        <div>
          <LogoMark className="h-10 w-10" />
          <p className="mt-8 font-display text-3xl font-semibold tracking-tight text-balance">{title}</p>
          <p className="mt-3 text-muted-foreground">{subtitle}</p>

          <ul className="mt-10 space-y-6">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="feature-icon-ring">
                  <feature.icon className="h-4 w-4 text-primary" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{feature.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{feature.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">{footerNote}</p>
      </aside>

      <section className={cn('surface-panel w-full p-6 sm:p-8')}>{children}</section>
    </div>
  );
}