import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

interface Author {
  id: string;
  name: string;
  avatar?: string;
}

interface Journal {
  id: string;
  title: string;
  content: string;
  images?: string[];
  isPublic: boolean;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

export function useJournals() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        const response = await fetch('/api/journals');
        if (!response.ok) {
          throw new Error('Failed to fetch journals');
        }
        const data = await response.json();
        setJournals(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchJournals();
    }
  }, [user]);

  return {
    journals,
    isLoading,
    error,
  };
} 