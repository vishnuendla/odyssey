import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJournal } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import AppPage from '@/components/layout/AppPage';
import JournalList from '@/components/journals/JournalList';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles } from 'lucide-react';
import ContentLoader from '@/components/shared/ContentLoader';
import Onboarding from '@/components/onboarding/Onboarding';
import { User } from '@/types';

type JournalFilter = 'all' | 'published' | 'drafts';

const JournalsPage = () => {
  const { getUserJournals, isLoading } = useJournal();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [filter, setFilter] = useState<JournalFilter>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setUserMap({
        [user.id]: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: new Date().toISOString()
        }
      });
    }
  }, [user]);

  const userJournals = getUserJournals();
  const publishedCount = userJournals.filter((journal) => journal.isPublic).length;
  const draftCount = userJournals.length - publishedCount;
  const visibleJournals = userJournals.filter((journal) => {
    if (filter === 'published') return journal.isPublic;
    if (filter === 'drafts') return !journal.isPublic;
    return true;
  });

  return (
      <AppPage
        eyebrow="Your library"
        title="My travel journals"
        description={
          userJournals.length > 0
            ? `${userJournals.length} ${userJournals.length === 1 ? 'entry' : 'entries'} — drafts and published trips in one calm workspace.`
            : 'Start documenting where you went and how it felt.'
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/ask">
                <Sparkles className="h-4 w-4 mr-2" /> Ask your journal
              </Link>
            </Button>
            <Button asChild>
              <Link to="/create">
                <PlusCircle className="h-4 w-4 mr-2" /> New journal
              </Link>
            </Button>
          </>
        }
      >
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({userJournals.length})
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('published')}
          >
            Published ({publishedCount})
          </Button>
          <Button
            variant={filter === 'drafts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('drafts')}
          >
            Drafts ({draftCount})
          </Button>
        </div>

        {isLoading ? (
          <ContentLoader label="Loading your journals…" />
        ) : (
          <>
            {userJournals.length === 0 && <Onboarding hasJournals={false} />}
            <JournalList 
              journals={visibleJournals}
              showCreateButton={false}
              emptyMessage={
                filter === 'drafts'
                  ? 'You have no drafts. Private journals appear here.'
                  : filter === 'published'
                    ? 'You have no published journals yet.'
                    : 'You have not created any journals yet. Choose New Journal to get started'
              }
              userMap={userMap}
            />
          </>
        )}
        
        {!isLoading && userJournals.length === 0 && (
          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link to="/create">Create Your First Journal</Link>
            </Button>
          </div>
        )}
      </AppPage>
  );
};

export default JournalsPage;
