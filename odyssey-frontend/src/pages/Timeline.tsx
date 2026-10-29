import React, { useState,useEffect } from 'react';
import { useJournal } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Timeline from '@/components/timeline/Timeline';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Map } from 'lucide-react';
import { Link,useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const TimelinePage = () => {
  const { journals, isLoading } = useJournal();
  const { user, isAuthenticated } = useAuth();
  const [showPrivate, setShowPrivate] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast({
        variant: "destructive",
        description: 'You must be logged in to view your timeline',
      });      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const filteredJournals = isAuthenticated && user
    ? journals.filter(journal =>
        journal.userId === user.id && (journal.isPublic || showPrivate)
      )
    : [];

  return (
    <>
      <Navbar />
      <main className="container py-12 px-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Travel Timeline</h1>
            <p className="text-muted-foreground max-w-2xl">
              A chronological journey through all the places you've visited and documented.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline">
              <Link to="/map">
                <Map className="mr-2 h-4 w-4" />
                View on Map
              </Link>
            </Button>
            <Button asChild>
              <Link to="/create">Create New Entry</Link>
            </Button>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="show-private"
              checked={showPrivate}
              onCheckedChange={setShowPrivate}
            />
            <Label htmlFor="show-private">Show private journals</Label>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading your timeline...</p>
          </div>
        ) : filteredJournals.length > 0 ? (
          <div className="mt-6">
            <Timeline journals={filteredJournals} />
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">No travel journals yet</h3>
            <p className="text-muted-foreground mb-6">
              {isAuthenticated
                ? "Start documenting your travels by creating your first journal"
                : "Log in to create your own travel timeline or explore public journals"}
            </p>
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/create">Create Your First Journal</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default TimelinePage;
