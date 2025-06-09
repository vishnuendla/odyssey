
import { useState } from 'react';
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InteractiveMap from '@/components/map/InteractiveMap';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const MapViewPage = () => {
  const { journals, isLoading } = useJournal();
  const { isAuthenticated, user } = useAuth();
  const [showOnlyMyJournals, setShowOnlyMyJournals] = useState(false);
  
  // Filter journals based on the switch state
  const filteredJournals = showOnlyMyJournals && isAuthenticated
    ? journals.filter(journal => journal.userId === user?.id)
    : journals.filter(journal => journal.isPublic);
    
  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Travel Map</h1>
          <p className="text-muted-foreground max-w-3xl">
            Explore travel journals visually through our interactive map. Click on markers to view journal details.
          </p>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="show-only-my-journals"
              checked={showOnlyMyJournals}
              onCheckedChange={setShowOnlyMyJournals}
            />
            <Label htmlFor="show-only-my-journals">Show private also</Label>
          </div>
        )}
        
        <div className="h-[600px] rounded-lg overflow-hidden border">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <InteractiveMap journals={filteredJournals} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MapViewPage;
