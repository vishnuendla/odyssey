
import React, { createContext, useContext, useState, useEffect } from 'react';
import { JournalEntry, Location } from '../types';
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
    const fetchJournals = async () => {
      try {
        setIsLoading(true);
        const fetchedJournals = await journalApi.getUserJournals();
        setJournals(fetchedJournals);
        setError(null);
      } catch (error) {
        setError('Failed to fetch journals');
        console.error('Failed to fetch journals', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchJournals();
    } else {
      fetchPublicJournals();
    }
  }, [isAuthenticated]);

  const fetchPublicJournals = async () => {
    try {
      setIsLoading(true);
      const publicJournals = await journalApi.getPublicJournals();
      // Handle paginated response - extract content array
      const journalsArray = Array.isArray(publicJournals) 
        ? publicJournals 
        : (publicJournals as any)?.content || [];
      setJournals(journalsArray);
      setError(null);
    } catch (error) {
      setError('Failed to fetch public journals');
      console.error('Failed to fetch public journals', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createJournal = async (journal: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>) => {
    if (!user) {
      toast({
        variant: "destructive",
        description: 'You must be logged in to create a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      const newJournal = await journalApi.createJournal(journal);
      setJournals(prevJournals => [...prevJournals, newJournal]);
      toast({
        description: 'Journal created successfully',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: 'Failed to create journal',
      });
      console.error('Failed to create journal', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateJournal = async (id: string, journal: Partial<JournalEntry>) => {
    if (!user) {
      toast({
        variant: "destructive",
        description: 'You must be logged in to update a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      const updatedJournal = await journalApi.updateJournal(id, journal);
      setJournals(prevJournals => 
        prevJournals.map(j => j.id === id ? updatedJournal : j)
      );
      toast({
        description: 'Journal updated successfully',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: 'Failed to update journal',
      });
      console.error('Failed to update journal', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJournal = async (id: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        description: 'You must be logged in to delete a journal',
      });
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      await journalApi.deleteJournal(id);
      setJournals(prevJournals => prevJournals.filter(journal => journal.id !== id));
      toast({
        description: 'Journal deleted successfully',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: 'Failed to delete journal',
      });
      console.error('Failed to delete journal', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getJournalById = (id: string) => {
    return journals.find(journal => journal.id === id);
  };

  const getUserJournals = () => {
    if (!user) return [];
    // Ensure journals is an array before filtering
    const journalsArray = Array.isArray(journals) ? journals : [];
    return journalsArray.filter(journal => journal.userId === user.id);
  };

  const getPublicJournals = () => {
    // Ensure journals is an array before filtering
    const journalsArray = Array.isArray(journals) ? journals : [];
    return journalsArray.filter(journal => journal.isPublic);
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
