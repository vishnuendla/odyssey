import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { journalApi } from '@/services/api';

export default function CallToAction() {
  const { user, isAuthenticated } = useAuth();
  const [journalCount, setJournalCount] = useState<number | null>(null); // null means loading

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        if (isAuthenticated) {
          const data = await journalApi.getUserJournals();
          setJournalCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching journals:', error);
        setJournalCount(0);
      }
    };

    fetchJournals();
  }, [isAuthenticated]);

  // Dynamic text based on journal count
  const getCTAButtonText = () => {
    if (!isAuthenticated) return "Sign Up Free";
    if (journalCount === null) return "Loading...";
    if (journalCount === 0) return "Create Your First Entry";
    if (journalCount < 5) return "Add Another Entry";
    return "You're on a roll! Add More?";
  };

  return (
    <section className="py-16 bg-primary">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl text-primary-foreground font-bold mb-4">
            Start Documenting Your Travel Story Today
          </h2>

          <p className="text-xl text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
            Join thousands of travelers who use <strong>Odyssey</strong> to preserve their memories and share their adventures with the world.
          </p>

          {isAuthenticated && journalCount !== null && (
            <p className="text-md text-primary-foreground/80 mb-6">
              You’ve created <strong>{journalCount}</strong> {journalCount === 1 ? 'memory' : 'memories'} so far!
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild disabled={journalCount === null}>
              <Link to={isAuthenticated ? "/create" : "/register"}>
                {getCTAButtonText()}
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link to="/explore">Explore Journals</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
