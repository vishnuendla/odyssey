
import { useJournal } from '@/contexts/JournalContext';
import PageShell from '@/components/layout/PageShell';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import FeaturedJournals from '@/components/home/FeaturedJournals';
import MapPreview from '@/components/home/MapPreview';
import CallToAction from '@/components/home/CallToAction';
import { Skeleton } from '@/components/ui/skeleton';
const HomePage = () => {
  const { isLoading } = useJournal();
    
  return (
    <PageShell hero>
        <Hero />
        
        {isLoading ? (
          <section className="py-12">
            <div className="mx-auto w-full max-w-6xl px-4">
              <div className="page-head">
                <div className="page-head-body">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl border bg-card">
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-3 p-5">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <FeaturedJournals />
        )}
        <Features />
        <MapPreview />
        <CallToAction />
    </PageShell>
  );
};

export default HomePage;
