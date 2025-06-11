import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useJournal } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/types';

const JournalsPage = () => {
  const { getUserJournals, isLoading } = useJournal();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [userMap, setUserMap] = useState<Record<string, User>>({});

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

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Travel Journals</h1>
            <p className="text-muted-foreground">
              {userJournals.length > 0 
                ? `You have ${userJournals.length} journal ${userJournals.length === 1 ? 'entry' : 'entries'}`
                : 'Start documenting your travel experiences'}
            </p>
          </div>
          <Button className="mt-4 md:mt-0" asChild>
            <Link to="/create">
              <PlusCircle className="h-4 w-4 mr-2" /> New Journal
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border">
                <Skeleton className="h-48 w-full" />
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <JournalList 
            explore="false"
            journals={userJournals} 
            emptyMessage="You haven't created any journals yet. Click 'New Journal' to get started!"
            userMap={userMap}
          />
        )}
        
        {!isLoading && userJournals.length === 0 && (
          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link to="/create">Create Your First Journal</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default JournalsPage;
