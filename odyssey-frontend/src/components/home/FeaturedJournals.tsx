import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { journalApi, accountApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import JournalCard from '@/components/journals/JournalCard';
import { User } from '@/types';

const FeaturedJournals = () => {
  const [journals, setJournals] = useState([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await journalApi.getPublicJournals();
        const filtered = data.filter(journal => journal.userId !== user?.id);
        setJournals(filtered);

        // Fetch user information for all unique authors
        const userIds = [...new Set(filtered.map(journal => journal.userId))];
        const userInfoPromises = userIds.map(async (userId) => {
          try {
            const userInfo = await accountApi.getUser(userId);
            return { id: userId, ...userInfo };
          } catch (error) {
            console.error(`Failed to fetch user info for ${userId}:`, error);
            return { id: userId, name: 'Anonymous' };
          }
        });

        const userInfos = await Promise.all(userInfoPromises);
        const newUserMap = userInfos.reduce((acc, user) => ({
          ...acc,
          [user.id]: user
        }), {});
        
        setUserMap(newUserMap);
      } catch (error) {
        console.error('Error fetching journals:', error);
      }
    };
    fetchJournals();
  }, [user?.id]);

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Featured Journals</h2>
            <p className="text-muted-foreground mb-4 md:mb-0">
              Discover inspiring travel stories from our community
            </p>
          </div>
          <Link
            to="/explore"
            className="text-primary hover:underline md:mt-0"
          >
            View all journals
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.slice(0, 3).map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              userName={userMap[journal.userId]?.name || 'Anonymous'}
              userAvatar={userMap[journal.userId]?.avatar}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedJournals;
