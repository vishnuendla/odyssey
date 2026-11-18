import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import ContentLoader from '@/components/shared/ContentLoader';
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
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="page-head">
          <div className="page-head-body">
            <span className="eyebrow">Saved</span>
            <h1 className="text-3xl font-semibold tracking-tight">Saved Journals</h1>
            <p className="text-muted-foreground">
              Journals you bookmarked to read again.
            </p>
          </div>
        </div>

        {isLoading ? (
          <ContentLoader label="Loading your saved journals…" />
        ) : (
          <JournalList
            journals={journals}
            showCreateButton={false}
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
