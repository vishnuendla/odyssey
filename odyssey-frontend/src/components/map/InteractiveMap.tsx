import React, { useEffect, useRef, useState, useMemo } from 'react';
import { JournalEntry } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mock implementation of a map component
export default function InteractiveMap({ journals }: { journals: JournalEntry[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Define fixed locations with approximate map positions
  const fixedLocations = [
    {
      name: 'New York',
      latitude: 40.7128, // Approximate latitude
      longitude: -74.0060, // Approximate longitude
    },
    {
      name: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
    },
    {
      name: 'Montmartre', // Using Paris coordinates, focusing on Montmartre area
      latitude: 48.8867,
      longitude: 2.3431,
    },
  ];

  // Assign each journal a location and position, cycling through fixedLocations
  const journalPositions = useMemo(() => {
    return journals.map((journal, index) => {
      const location = fixedLocations[index % fixedLocations.length];
      // Convert lat/lon to percentage-based positions for the mock map
      const left = `${((location.longitude + 180) / 360) * 100}%`;
      const top = `${((90 - location.latitude) / 180) * 100}%`;
      return {
        ...journal,
        location: {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        },
        position: { left, top },
      };
    });
  }, [journals]);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
      if (journalPositions.length > 0) {
        setSelectedJournal(journalPositions[0]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [journalPositions]);

  const selectNextJournal = () => {
    if (!selectedJournal) return;
    const currentIndex = journalPositions.findIndex(j => j.id === selectedJournal.id);
    const nextIndex = (currentIndex + 1) % journalPositions.length;
    setSelectedJournal(journalPositions[nextIndex]);
  };

  const selectPrevJournal = () => {
    if (!selectedJournal) return;
    const currentIndex = journalPositions.findIndex(j => j.id === selectedJournal.id);
    const prevIndex = (currentIndex - 1 + journalPositions.length) % journalPositions.length;
    setSelectedJournal(journalPositions[prevIndex]);
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border">
      <div
        ref={mapContainerRef}
        className="w-full h-full bg-gray-200 relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2874&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {mapLoaded &&
          journalPositions.map((journal, index) => (
            <div
              key={journal.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                selectedJournal?.id === journal.id ? 'z-10 scale-125' : 'z-0 scale-100'
              }`}
              style={{
                left: journal.position.left,
                top: journal.position.top,
              }}
              onClick={() => setSelectedJournal(journal)}
            >
              <div
                className={`w-4 h-4 rounded-full ${
                  selectedJournal?.id === journal.id ? 'bg-primary shadow-lg' : 'bg-accent-foreground'
                }`}
              >
                <div
                  className={`absolute animate-ping w-4 h-4 rounded-full bg-primary/30 ${
                    selectedJournal?.id === journal.id ? 'opacity-100' : 'opacity-0'
                  }`}
                ></div>
              </div>
            </div>
          ))}
      </div>

      {/* Journal card overlay */}
      {selectedJournal && (
        <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card/95 shadow-lg backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg line-clamp-1">{selectedJournal.title}</h3>
              <div className="flex space-x-1">
                <Button size="icon" variant="ghost" onClick={selectPrevJournal}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={selectNextJournal}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedJournal.images && selectedJournal.images.length > 0 && (
              <div className="mb-2 h-32 rounded-md overflow-hidden">
                <img
                  src={selectedJournal.images[0]}
                  alt={selectedJournal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
              <span>{selectedJournal.location.name}</span>
              <span>{new Date(selectedJournal.createdAt).toLocaleDateString()}</span>
            </div>

            <p className="text-sm line-clamp-2">{selectedJournal.content}</p>

            <div className="mt-3">
              <Button size="sm" variant="outline" asChild className="w-full">
                <a href={`/journals/${selectedJournal.id}`}>View Journal</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}