import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppPage from '@/components/layout/AppPage';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import ContentLoader from '@/components/shared/ContentLoader';
import { Image as ImageIcon } from 'lucide-react';
import { journalApi } from '@/services/api';
import { readListCache, writeListCache } from '@/lib/listCache';
import { JournalEntry } from '@/types';

interface GalleryItem {
  journal: JournalEntry;
  image: string;
}

const GALLERY_CACHE = 'gallery:photos';

// Stale-while-revalidate cache: returning to the gallery renders instantly
// instead of flashing a placeholder grid on every tab switch. sessionStorage
// keeps that true across a reload or a reopen within the same tab session.
const cachedGalleryItems =
  readListCache<GalleryItem[]>(GALLERY_CACHE);

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>(cachedGalleryItems ?? []);
  const [isLoading, setIsLoading] = useState(cachedGalleryItems === null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const journals = await journalApi.searchPublicJournals({ size: 100 });
        const flattened = journals.flatMap((journal) =>
          (journal.images ?? []).map((image) => ({ journal, image }))
        );
        setItems(flattened);
        writeListCache(GALLERY_CACHE, flattened);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
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
    <AppPage
      eyebrow="Gallery"
      title="Travel Gallery"
      description={
        items.length > 0
          ? `${items.length} ${items.length === 1 ? 'photo' : 'photos'} from ${journalCount} public ${
              journalCount === 1 ? 'journal' : 'journals'
            }`
          : 'Photos shared by the Odyssey community'
      }
    >
      {isLoading ? (
        <ContentLoader label="Loading photos…" />
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
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
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
    </AppPage>
  );
};

export default GalleryPage;
