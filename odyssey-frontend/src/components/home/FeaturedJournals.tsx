
import React from 'react';
import { JournalEntry } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import JournalCard from '../journals/JournalCard';
import { ArrowRight } from 'lucide-react';

interface FeaturedJournalsProps {
  journals: JournalEntry[];
}

export default function FeaturedJournals({ journals }: FeaturedJournalsProps) {
  // Create a map of user IDs to user info (in a real app, this would come from a users API)
  const userMap: Record<string, { name: string, avatar?: string }> = {
    "1": { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=john" },
    "2": { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=jane" }
  };
  
  return (
    <section className="py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Journals</h2>
            <p className="text-muted-foreground max-w-2xl">
              Discover handpicked travel experiences from adventurers around the world
            </p>
          </div>
          <Button variant="ghost" className="mt-4 md:mt-0" asChild>
            <Link to="/explore" className="flex items-center">
              Explore all <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.slice(0, 3).map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              userName={userMap[journal.userId]?.name}
              userAvatar={userMap[journal.userId]?.avatar}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
