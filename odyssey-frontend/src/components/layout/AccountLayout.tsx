import { NavLink } from 'react-router-dom';
import { Shield, Settings, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';

const accountLinks = [
  { to: '/profile', label: 'Profile', description: 'Public identity & travel stats', icon: UserRound },
  { to: '/settings', label: 'Preferences', description: 'Theme, account & data', icon: Settings },
  { to: '/security', label: 'Security', description: 'Password & sessions', icon: Shield },
] as const;

type AccountLayoutProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function AccountLayout({ title, description, actions, children }: AccountLayoutProps) {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,15.5rem)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <aside aria-label="Account sections" className="mb-8 lg:mb-0">
            <p className="eyebrow mb-3 hidden lg:block">Your account</p>
            <nav className="account-nav">
              {accountLinks.map(({ to, label, description: hint, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn('account-nav-link', isActive && 'account-nav-link-active')
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">{hint}</span>
                  </span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            <PageHeader eyebrow="Account" title={title} description={description} actions={actions} />
            <div className="space-y-8">{children}</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}