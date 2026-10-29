import React, { useEffect, useRef, useState } from 'react';
import { JournalEntry } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  journals: JournalEntry[];
  onJournalSelect: (journal: JournalEntry) => void;
  selectedJournal: JournalEntry | null;
}

export default function InteractiveMap({ journals, onJournalSelect, selectedJournal }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Define world bounds (southwest and northeast corners)
    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const bounds = L.latLngBounds(southWest, northEast);

    const initialMap = L.map(mapRef.current, {
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0 // Makes the bounds "solid"
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      noWrap: true // Prevents the map from wrapping around
    }).addTo(initialMap);

    // Add zoom control to the top right
    L.control.zoom({
      position: 'topright'
    }).addTo(initialMap);

    setMap(initialMap);
    setMapLoaded(true);

    // Select a random journal by default if there are journals
    if (journals.length > 0) {
      const randomIndex = Math.floor(Math.random() * journals.length);
      const randomJournal = journals[randomIndex];
      onJournalSelect(randomJournal);
      
      // Smooth zoom to the random journal's location
      if (randomJournal.location?.latitude && randomJournal.location?.longitude) {
        setTimeout(() => {
          initialMap.flyTo(
            [randomJournal.location.latitude, randomJournal.location.longitude],
            12,
            {
              duration: 2,
              easeLinearity: 0.25
            }
          );
        }, 500); // Small delay to ensure map is fully loaded
      }
    }

    return () => {
      initialMap.remove();
    };
  }, []);

  // Handle selected journal changes
  useEffect(() => {
    if (!map || !mapLoaded || !selectedJournal?.location) return;

    const { latitude, longitude } = selectedJournal.location;
    
    // Ensure the coordinates are valid numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.error('Invalid coordinates:', { latitude, longitude });
      return;
    }

    // Get current center and zoom
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // First zoom out from current location
    map.flyTo(
      currentCenter,
      2, // Zoom out to level 4
      {
        duration: 2,
        easeLinearity: 0.25
      }
    );

    // After zooming out, move to new location while staying zoomed out
    setTimeout(() => {
      map.flyTo(
        [latitude, longitude],
        4, // Keep zoom level 4
        {
          duration: 0.5,
          easeLinearity: 0.25
        }
      );

      // Finally zoom in to the new location
      setTimeout(() => {
        map.flyTo(
          [latitude, longitude],
          12,
          {
            duration: 1,
            easeLinearity: 0.25
          }
        );
      }, 500);
    }, 500);
  }, [selectedJournal, map, mapLoaded]);

  // Update markers when journals change
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    const newMarkers: L.Marker[] = [];

    journals.forEach(journal => {
      if (journal.location?.latitude && journal.location?.longitude) {
        const marker = L.marker([
          journal.location.latitude,
          journal.location.longitude
        ]).addTo(map);

        marker.bindPopup(journal.title);
        marker.on('click', () => {
          onJournalSelect(journal);
          // Get current center and zoom
          const currentCenter = map.getCenter();
          const currentZoom = map.getZoom();

          // First zoom out from current location
          map.flyTo(
            currentCenter,
            4, // Zoom out to level 4
            {
              duration: 0.5,
              easeLinearity: 0.25
            }
          );

          // After zooming out, move to new location while staying zoomed out
          setTimeout(() => {
            map.flyTo(
              [journal.location.latitude, journal.location.longitude],
              4, // Keep zoom level 4
              {
                duration: 0.5,
                easeLinearity: 0.25
              }
            );

            // Finally zoom in to the new location
            setTimeout(() => {
              map.flyTo(
                [journal.location.latitude, journal.location.longitude],
                12,
                {
                  duration: 1,
                  easeLinearity: 0.25
                }
              );
            }, 500);
          }, 500);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Fit map to show all markers with padding
    if (newMarkers.length > 0) {
      const group = L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, journals, mapLoaded, onJournalSelect]);

  const handleReset = () => {
    if (!map) return;
    
    // Fit map to show all markers with padding
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.flyToBounds(group.getBounds().pad(0.1), {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else {
      // If no markers, reset to world view
      map.flyTo([0, 0], 2, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-lg border">
      <div
        ref={mapRef}
        className="w-full h-full z-0"
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 z-[1000] bg-background/80 backdrop-blur-sm hover:bg-background"
        onClick={handleReset}
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}