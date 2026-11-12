import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { journalApi, accountApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import JournalCard from '@/components/journals/JournalCard';
import { User, JournalEntry } from '@/types';

const FeaturedJournals = () => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const data = await journalApi.getPublicJournals();
        const filtered = data.filter(journal => journal.userId !== user?.id);
        setJournals(filtered);

        // Build author info from journal data first, then fall back to
        // per-author fetches only for entries that are missing it.
        const userMapEntries: Record<string, User> = {};
        const missingIds = new Set<string>();
        for (const journal of filtered) {
          if (journal.userName) {
            userMapEntries[journal.userId] = { id: journal.userId, name: journal.userName, avatar: journal.userAvatar } as User;
          } else {
            missingIds.add(journal.userId);
          }
        }

        // Fetch user information for authors without inline data
        const userIds = [...missingIds];
        const userInfoPromises = userIds.map(async (userId) => {
          try {
            const userInfo = await accountApi.getUser(userId);
            return { ...userInfo, id: userId };
          } catch (error) {
            console.error(`Failed to fetch user info for ${userId}:`, error);
            return { id: userId, name: 'Anonymous', email: '', createdAt: '' } as User;
          }
        });

        const userInfos = await Promise.all(userInfoPromises);
        const newUserMap = userInfos.reduce<Record<string, User>>((acc, user) => ({
          ...acc,
          [user.id]: user
        }), { ...userMapEntries });
        
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
