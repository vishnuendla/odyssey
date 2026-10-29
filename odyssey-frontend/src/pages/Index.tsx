
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import FeaturedJournals from '@/components/home/FeaturedJournals';
import MapPreview from '@/components/home/MapPreview';
import CallToAction from '@/components/home/CallToAction';
import { Skeleton } from '@/components/ui/skeleton';
import {useEffect,useState} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {journalApi} from '@/services/api'


const HomePage = () => {
  const { journals, isLoading } = useJournal();
  const [demoJournals, setDemoJournals] = useState([]);
  const { user } = useAuth();
  
    useEffect(() => {
        const fetchJournals = async () => {
          try {
            const data = await journalApi.getPublicJournals();
            const filtered = data.filter(journal => journal.userId !== user?.id);
            setDemoJournals(filtered);
          } catch (error) {
            console.error('Error fetching journals:', error);
          }
        };
        fetchJournals();
      }, []);
  const featuredJournals = demoJournals
    .filter(journal => journal.isPublic)
    .sort(() => 0.5 - Math.random()) // Simple randomization
    .slice(0, 3);
    
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        
        {isLoading ? (
          <section className="py-12">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                  <Skeleton className="h-10 w-64 mb-2" />
                  <Skeleton className="h-5 w-96" />
                </div>
                <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg overflow-hidden border">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <FeaturedJournals journals={featuredJournals} />
        )}
        <Features />
        <MapPreview />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
