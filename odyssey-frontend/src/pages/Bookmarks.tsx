import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { journalApi } from '@/services/api';
import { JournalEntry, User } from '@/types';

const BookmarksPage = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const data = await journalApi.getBookmarkedJournals();
        setJournals(data);
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error);
        toast({
          variant: 'destructive',
          description: 'Could not load your saved journals. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated, navigate, toast]);

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    for (const journal of journals) {
      if (journal.userName) {
        map[journal.userId] = {
          id: journal.userId,
          name: journal.userName,
          avatar: journal.userAvatar,
          email: '',
          createdAt: '',
        };
      }
    }
    return map;
  }, [journals]);

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Saved Journals</h1>
          <p className="text-muted-foreground">
            Journals you bookmarked to read again.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <JournalList
            explore="true"
            journals={journals}
            emptyMessage="You haven't saved any journals yet. Tap the bookmark icon on a public journal to save it here."
            userMap={userMap}
          />
        )}
      </main>
      <Footer />
    </>
  );
};

export default BookmarksPage;
