import React, { useEffect, useState } from 'react';
import { JournalEntry } from '@/types';
import JournalCard from './JournalCard';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { journalApi } from '@/services/api';
interface JournalListProps {
  journals?: JournalEntry[];
  emptyMessage?: string;
  className?: string;
  explore?: string;
}

export default function JournalList({explore="true", emptyMessage = "No journals found", className ,journals: propJournals}: JournalListProps) {
  const { user } = useAuth();
  const location = useLocation();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        if (explore === "true") {
          // Use props passed from parent (filteredJournals)
          setJournals(propJournals ?? []);
        } else {
          const response = await journalApi.getUserJournals();
          setJournals(response);
        }
      } catch (error) {
        console.error('Error fetching journals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [explore, propJournals]);

  const userMap: Record<string, { name: string, avatar?: string }> = {
    "1": { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=john" },
    "2": { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=jane" }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading journals...</div>;
  }

  if (!journals || journals.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {journals.map((journal) => {
        const isCurrentUser = user?.id === journal.userId;
        const userName = isCurrentUser ? user?.name : userMap[journal.userId]?.name;
        const userAvatar = isCurrentUser ? user?.avatar : userMap[journal.userId]?.avatar;

        return (
          <JournalCard
            key={journal.id}
            journal={journal}
            userName={userName}
            userAvatar={userAvatar}
          />
        );
      })}
    </div>
  );
}
