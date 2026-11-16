import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { JournalEntry } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import InteractiveMap from '@/components/map/InteractiveMap';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { journalApi } from '@/services/api';

// Fix Leaflet marker icons (Next.js workaround)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapViewPage = () => {
  const { journals, isLoading: ownLoading } = useJournal();
  const { isAuthenticated, user } = useAuth();
  const [includePrivate, setIncludePrivate] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [publicJournals, setPublicJournals] = useState<JournalEntry[]>([]);
  const [publicLoading, setPublicLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    journalApi.getPublicJournals()
      .then((list) => {
        if (!cancelled) setPublicJournals(list);
      })
      .catch((error) => console.error('Failed to load public journals for the map', error))
      .finally(() => {
        if (!cancelled) setPublicLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ownJournals = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return journals.filter((journal) => journal.userId === user.id);
  }, [isAuthenticated, journals, user]);

  // The map always shows the world's public journeys. Signed-in readers can add
  // their own private entries on top; that is what the toggle actually means.
  const filteredJournals = useMemo(() => {
    const merged = new Map<string, JournalEntry>();
    publicJournals.filter((journal) => journal.isPublic).forEach((journal) => merged.set(journal.id, journal));
    if (includePrivate) {
      ownJournals.forEach((journal) => merged.set(journal.id, journal));
    }
    return Array.from(merged.values());
  }, [publicJournals, ownJournals, includePrivate]);

  useEffect(() => {
    if (selectedJournal && !filteredJournals.some((journal) => journal.id === selectedJournal.id)) {
      setSelectedJournal(null);
    }
  }, [filteredJournals, selectedJournal]);

  const isLoading = publicLoading || (includePrivate && ownLoading);

  const selectNextJournal = () => {
    if (!selectedJournal || filteredJournals.length === 0) return;
    const currentIndex = filteredJournals.findIndex(j => j.id === selectedJournal.id);
    const nextIndex = (currentIndex + 1) % filteredJournals.length;
    setSelectedJournal(filteredJournals[nextIndex]);
  };

  const selectPrevJournal = () => {
    if (!selectedJournal || filteredJournals.length === 0) return;
    const currentIndex = filteredJournals.findIndex(j => j.id === selectedJournal.id);
    const prevIndex = (currentIndex - 1 + filteredJournals.length) % filteredJournals.length;
    setSelectedJournal(filteredJournals[prevIndex]);
  };
    
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="page-head mb-6 sm:mb-8">
          <div className="page-head-body">
            <span className="eyebrow">Atlas</span>
            <h1 className="text-3xl font-semibold tracking-tight">Travel Map</h1>
            <p className="text-muted-foreground max-w-3xl">
              Every public journey, plotted on one map. Click a marker to read the story behind the pin.
            </p>
          </div>
          {isAuthenticated && (
            <div className="page-head-actions">
              <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2" style={{ boxShadow: 'var(--shadow-card)' }}>
                <Switch
                  id="include-private-journals"
                  checked={includePrivate}
                  onCheckedChange={setIncludePrivate}
                />
                <Label htmlFor="include-private-journals" className="text-sm cursor-pointer">
                  Include my private journals
                </Label>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="w-full rounded-xl overflow-hidden border" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="aspect-[3/2] sm:aspect-[2/1] overflow-hidden relative">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <InteractiveMap 
                    journals={filteredJournals} 
                    onJournalSelect={setSelectedJournal}
                    selectedJournal={selectedJournal}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              {selectedJournal ? (
                <Card className="overflow-hidden rounded-xl bg-card">
                  {selectedJournal.images && selectedJournal.images.length > 0 && (
                    <div className="h-36 sm:h-44 overflow-hidden border-b">
                      <img
                        src={selectedJournal.images[0]}
                        alt={selectedJournal.title}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-base leading-snug line-clamp-2">{selectedJournal.title}</h3>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" onClick={selectPrevJournal} className="h-8 w-8" aria-label="Previous journal">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={selectNextJournal} className="h-8 w-8" aria-label="Next journal">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
                      {selectedJournal.location?.name && (
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{selectedJournal.location.name}</span>
                        </span>
                      )}
                      <span>{new Date(selectedJournal.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs sm:text-sm line-clamp-3 text-muted-foreground">{selectedJournal.content}</p>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" asChild className="flex-1">
                        <Link to={`/journals/${selectedJournal.id}`}>View Journal</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedJournal(null)}
                        className="shrink-0"
                        aria-label="Close preview"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-xl bg-card">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="eyebrow">Journals on the map</h3>
                      <span className="text-xs text-muted-foreground">{filteredJournals.length}</span>
                    </div>
                    {filteredJournals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No journals with a location yet. Publish a journal with a place to see it here.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 sm:max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                        {filteredJournals.map((journal) => (
                          <button
                            type="button"
                            key={journal.id}
                            onClick={() => setSelectedJournal(journal)}
                            className="w-full text-left p-2 rounded-lg border border-transparent hover:border-border hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <div className="flex items-start gap-3">
                              {journal.images && journal.images.length > 0 ? (
                                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                  <img
                                    src={journal.images[0]}
                                    alt={journal.title}
                                    width={64}
                                    height={64}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex w-14 h-14 items-center justify-center rounded-lg bg-secondary shrink-0">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1">{journal.title}</h4>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                  <span className="line-clamp-1">{journal.location?.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(journal.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MapViewPage;
