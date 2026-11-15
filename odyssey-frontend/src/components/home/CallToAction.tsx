import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { journalApi } from '@/services/api';

export default function CallToAction() {
  const { isAuthenticated } = useAuth();
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

  const ctaText = () => {
    if (!isAuthenticated) return 'Create an account';
    if (journalCount === null) return 'Loading';
    if (journalCount === 0) return 'Write your first entry';
    return 'Write another entry';
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="relative max-w-3xl mx-auto text-center overflow-hidden rounded-2xl border border-border bg-muted/40 px-6 py-12">
          {/* Signature: a dashed route line crossing the panel, ending in a pin */}
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full text-accent"
            viewBox="0 0 800 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M -10 20 C 160 55, 300 -5, 440 30 S 700 10, 790 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.7"
            />
            <circle cx="790" cy="40" r="5" fill="currentColor" />
            <circle cx="790" cy="40" r="2" fill="hsl(var(--background))" />
          </svg>

          <h2 className="text-3xl font-semibold mb-4">Put your next trip on the map</h2>

          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Write entries as you travel, pin each place and share the story when you are ready.
          </p>

          {isAuthenticated && journalCount !== null && (
            <p className="text-sm text-muted-foreground mb-6">
              You have written {journalCount} {journalCount === 1 ? 'entry' : 'entries'} so far
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild disabled={journalCount === null}>
              <Link to={isAuthenticated ? '/create' : '/register'}>
                {ctaText()}
              </Link>
            </Button>

            <Button size="lg" variant="outline" asChild>
              <Link to="/explore">Explore journals</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
