import PageHeader from '@/components/layout/PageHeader';
import PageShell from '@/components/layout/PageShell';

type AppPageProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: 'default' | 'wide' | 'full';
};

const widthClass = {
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  full: 'max-w-[90rem]',
} as const;

/** Standard content page: shell, header, and constrained main column. */
export default function AppPage({
  eyebrow,
  title,
  description,
  actions,
  children,
  width = 'wide',
}: AppPageProps) {
  return (
    <PageShell>
      {/* Matches the navbar and footer columns (max-w-7xl + lg:px-8) so every
          page's content lines up with the app chrome. */}
      <div className={`mx-auto w-full ${widthClass[width]} px-4 py-8 sm:px-6 lg:px-8 lg:py-12`}>
        <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
        {children}
      </div>
    </PageShell>
  );
}