import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/skeleton';
import { journalApi } from '@/services/api';
import { JournalEntry } from '@/types';

interface GalleryItem {
  journal: JournalEntry;
  image: string;
}

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const journals = await journalApi.searchPublicJournals({ size: 100 });
        const flattened = journals.flatMap((journal) =>
          (journal.images ?? []).map((image) => ({ journal, image }))
        );
        setItems(flattened);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const journalCount = useMemo(
    () => new Set(items.map((item) => item.journal.id)).size,
    [items]
  );

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Travel Gallery</h1>
          <p className="text-muted-foreground">
            {items.length > 0
              ? `${items.length} photos from ${journalCount} public ${journalCount === 1 ? 'journal' : 'journals'}`
              : 'Photos shared by the Odyssey community'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No photos have been shared yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(({ journal, image }, index) => (
              <Link
                key={`${journal.id}-${index}`}
                to={`/journals/${journal.id}`}
                className="group relative aspect-square overflow-hidden rounded-lg border"
              >
                <OptimizedImage
                  src={image}
                  alt={journal.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="line-clamp-2 text-sm font-semibold">{journal.title}</p>
                  {journal.location?.name && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
                      {journal.location.name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default GalleryPage;
