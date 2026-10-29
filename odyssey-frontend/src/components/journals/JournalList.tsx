import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { journalApi } from '@/services/api';
import { JournalEntry, User } from '@/types';
import JournalCard from './JournalCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface JournalListProps {
  explore?: string;
  emptyMessage?: string;
  className?: string;
  journals?: JournalEntry[];
  userMap?: Record<string, User>;
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
  explore = "true", 
  emptyMessage = "No journals found", 
  className, 
  journals: propJournals, 
  userMap = {} 
}: JournalListProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJournals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (explore === "true") {
        setJournals(propJournals ?? []);
        setTotalPages(Math.ceil((propJournals?.length ?? 0) / itemsPerPage));
      } else {
        const response = await journalApi.getUserJournals();
        setJournals(response);
        setTotalPages(Math.ceil(response.length / itemsPerPage));
      }
    } catch (error) {
      const errorMessage = 'Failed to fetch journals. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [explore, propJournals, itemsPerPage, toast]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const currentJournals = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return journals.slice(indexOfFirstItem, indexOfLastItem);
  }, [journals, currentPage, itemsPerPage]);

  if (loading) {
    return <JournalListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-center text-muted-foreground">{error}</p>
        <Button onClick={fetchJournals} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        {!explore && (
          <Button onClick={() => navigate('/journals/new')}>
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
            userName={userMap[journal.userId]?.name || 'Anonymous'}
            userAvatar={userMap[journal.userId]?.avatar}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {[...Array(totalPages)].map((_, index) => (
            <Button
              key={index}
              variant={currentPage === index + 1 ? "default" : "outline"}
              onClick={() => handlePageChange(index + 1)}
              className="w-10 h-10"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
