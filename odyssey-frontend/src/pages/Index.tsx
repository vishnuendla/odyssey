
import { useJournal } from '@/contexts/JournalContext';
import PageShell from '@/components/layout/PageShell';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import FeaturedJournals from '@/components/home/FeaturedJournals';
import MapPreview from '@/components/home/MapPreview';
import CallToAction from '@/components/home/CallToAction';
import ContentLoader from '@/components/shared/ContentLoader';
const HomePage = () => {
  const { isLoading } = useJournal();
    
  return (
    <PageShell hero>
        <Hero />
        
        {isLoading ? (
          <section className="py-12">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <ContentLoader label="Loading featured journals…" />
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
