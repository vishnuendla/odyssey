import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { journalApi } from '@/services/api';
import { JournalEntry, User } from '@/types';
import JournalCard from './JournalCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface JournalListProps {
  /** When provided, the list renders exactly these journals and does not fetch. */
  journals?: JournalEntry[];
  userMap?: Record<string, User>;
  emptyMessage?: string;
  className?: string;
  /** Client-side pagination. Turn off when the parent already pages the API. */
  paginate?: boolean;
  pageSize?: number;
  loading?: boolean;
  showCreateButton?: boolean;
}

const JournalListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

export default function JournalList({
  journals: propJournals,
  userMap = {},
  emptyMessage = 'No journals found',
  className,
  paginate = true,
  pageSize = 6,
  loading: propLoading = false,
  showCreateButton = true,
}: JournalListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fetchedJournals, setFetchedJournals] = useState<JournalEntry[]>([]);
  const [fetching, setFetching] = useState(propJournals === undefined);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const useProps = propJournals !== undefined;
  const journals = useProps ? propJournals : fetchedJournals;

  useEffect(() => {
    if (useProps) {
      return;
    }

    let cancelled = false;
    const fetchJournals = async () => {
      setFetching(true);
      setError(null);
      try {
        const response = await journalApi.getUserJournals();
        if (!cancelled) {
          setFetchedJournals(response);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to fetch journals. Please try again.');
          toast({
            variant: 'destructive',
            description: 'Failed to fetch journals. Please try again.',
          });
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    };

    fetchJournals();
    return () => {
      cancelled = true;
    };
  }, [useProps, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [journals.length, pageSize]);

  const totalPages = paginate ? Math.max(1, Math.ceil(journals.length / pageSize)) : 1;

  const currentJournals = useMemo(() => {
    if (!paginate) {
      return journals;
    }
    const start = (currentPage - 1) * pageSize;
    return journals.slice(start, start + pageSize);
  }, [journals, paginate, currentPage, pageSize]);

  const loading = propLoading || fetching;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <JournalListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-center text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {showCreateButton && (
          <Button onClick={() => navigate('/create')}>
            Create your first journal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentJournals.map((journal) => (
          <JournalCard
            key={journal.id}
            journal={journal}
            userName={userMap[journal.userId]?.name || journal.userName || 'Anonymous'}
            userAvatar={userMap[journal.userId]?.avatar || journal.userAvatar}
          />
        ))}
      </div>

      {paginate && totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Journal pages">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
