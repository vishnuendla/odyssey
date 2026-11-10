import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';
import { accountApi, ApiError } from '@/services/api';
import { JournalEntry, User } from '@/types';

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);
      try {
        const [userData, journalData] = await Promise.all([
          accountApi.getUser(id),
          accountApi.getUserJournals(id),
        ]);
        if (cancelled) return;
        setProfile(userData);
        setJournals(journalData);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load profile:', error);
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        }
        setProfile(null);
        setJournals([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-12 px-4">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-5xl mx-auto py-24 px-4 text-center">
          <UserIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Traveler not found</h1>
          <p className="text-muted-foreground mb-6">
            This profile may have been removed.
          </p>
          <Button asChild>
            <Link to="/explore">Explore journals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl mx-auto py-12 px-4">
        <Card className="mb-8">
          <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-6 text-center sm:text-left">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-3xl bg-primary/10">
                {profile.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{profile.name}</h1>

              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                {profile.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                )}
                <span>
                  {profile.journalsCount ?? journals.length}{' '}
                  {(profile.journalsCount ?? journals.length) === 1 ? 'journal' : 'journals'}
                </span>
              </div>

              {profile.bio && (
                <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Public Journals</h2>
        <JournalList
          explore="true"
          journals={journals}
          emptyMessage="This traveler has not published any public journals yet."
          userMap={{ [profile.id]: profile }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;
