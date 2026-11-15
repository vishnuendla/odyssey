import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
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
      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="page-head">
          <div className="page-head-body">
            <span className="eyebrow">Gallery</span>
            <h1 className="text-3xl font-semibold tracking-tight">Travel Gallery</h1>
            <p className="text-muted-foreground">
              {items.length > 0
                ? `${items.length} photos from ${journalCount} public ${journalCount === 1 ? 'journal' : 'journals'}`
                : 'Photos shared by the Odyssey community'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">No photos yet</p>
            <p className="text-sm text-muted-foreground">
              No photos have been shared yet.
            </p>
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link to="/explore">Explore journals</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(({ journal, image }, index) => (
              <Link
                key={`${journal.id}-${index}`}
                to={`/journals/${journal.id}`}
                className="card-lift group relative aspect-square overflow-hidden rounded-xl border"
              >
                <OptimizedImage
                  src={image}
                  alt={journal.title}
                  className="h-full w-full object-cover"
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
