import React, { createContext, useContext, useState, useEffect } from 'react';
import { JournalEntry } from '../types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { journalApi } from '@/services/api';

interface JournalContextType {
  journals: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  createJournal: (journal: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>) => Promise<void>;
  updateJournal: (id: string, journal: Partial<JournalEntry>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  getJournalById: (id: string) => JournalEntry | undefined;
  getUserJournals: () => JournalEntry[];
  getPublicJournals: () => JournalEntry[];
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = isAuthenticated
          ? await journalApi.getUserJournals()
          : await journalApi.getPublicJournals();
        if (!cancelled) {
          setJournals(fetched);
        }
      } catch (err) {
        if (!cancelled && (err as Error)?.name !== 'AbortError') {
          setError(isAuthenticated ? 'Failed to fetch journals' : 'Failed to fetch public journals');
          console.error('Failed to fetch journals', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const createJournal = async (journal: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        description: 'You must be logged in to create a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      const newJournal = await journalApi.createJournal(journal);
      setJournals((prev) => [...prev, newJournal]);
      toast({ description: 'Journal created successfully' });
    } catch (err) {
      console.error('Failed to create journal', err);
      throw err;
    }
  };

  const updateJournal = async (id: string, journal: Partial<JournalEntry>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        description: 'You must be logged in to update a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      const updatedJournal = await journalApi.updateJournal(id, journal);
      setJournals((prev) => prev.map((entry) => (entry.id === id ? updatedJournal : entry)));
      toast({ description: 'Journal updated successfully' });
    } catch (err) {
      console.error('Failed to update journal', err);
      throw err;
    }
  };

  const deleteJournal = async (id: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        description: 'You must be logged in to delete a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      await journalApi.deleteJournal(id);
      setJournals((prev) => prev.filter((entry) => entry.id !== id));
      toast({ description: 'Journal deleted successfully' });
    } catch (err) {
      console.error('Failed to delete journal', err);
      throw err;
    }
  };

  const getJournalById = (id: string) => {
    return journals.find((journal) => journal.id === id);
  };

  const getUserJournals = () => {
    if (!user) return [];
    return journals.filter((journal) => journal.userId === user.id);
  };

  const getPublicJournals = () => {
    return journals.filter((journal) => journal.isPublic);
  };

  const value = {
    journals,
    isLoading,
    error,
    createJournal,
    updateJournal,
    deleteJournal,
    getJournalById,
    getUserJournals,
    getPublicJournals,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
};
