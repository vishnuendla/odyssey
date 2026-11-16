import { useState, useEffect } from 'react';
import { useJournal } from '@/contexts/JournalContext';
import { useAuth } from '@/contexts/AuthContext';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/layout/PageHeader';
import Timeline from '@/components/timeline/Timeline';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Map, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
    <PageShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          eyebrow="Your journey"
          title="Travel Timeline"
          description="A chronological journey through all the places you've visited and documented."
          actions={
            <>
              <Button asChild variant="outline">
                <Link to="/map">
                  <Map className="mr-2 h-4 w-4" />
                  View on Map
                </Link>
              </Button>
              <Button asChild>
                <Link to="/create">Create New Entry</Link>
              </Button>
            </>
          }
        />

        {isAuthenticated && (
          <div className="mb-8 flex items-center gap-2">
            <Switch
              id="show-private"
              checked={showPrivate}
              onCheckedChange={setShowPrivate}
            />
            <Label htmlFor="show-private" className="text-sm text-muted-foreground">
              Show private journals
            </Label>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="route-loader" />
            <p className="text-sm text-muted-foreground">Loading your timeline...</p>
          </div>
        ) : filteredJournals.length > 0 ? (
          <Timeline journals={filteredJournals} />
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No travel journals yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {isAuthenticated
                ? "Start documenting your travels by creating your first journal"
                : "Log in to create your own travel timeline or explore public journals"}
            </p>
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/create">Create Your First Journal</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">Log In</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
};

export default TimelinePage;
