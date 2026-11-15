import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, User as UserIcon, Users, BookOpen } from 'lucide-react';
import { accountApi, ApiError } from '@/services/api';
import { JournalEntry, User } from '@/types';
import FollowButton from '@/components/social/FollowButton';

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
        <div className="mx-auto w-full max-w-4xl py-12 px-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Skeleton className="h-24 w-full rounded-none sm:h-32" />
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Skeleton className="-mt-12 h-20 w-20 rounded-full sm:-mt-14 sm:h-24 sm:w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="mx-auto w-full max-w-4xl py-24 px-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <UserIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Traveler not found</h1>
            <p className="mt-1 text-muted-foreground">
              This profile may have been removed.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/explore">Explore journals</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const journalsCount = profile.journalsCount ?? journals.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl py-8 px-4">
        <section
          aria-label="Profile header"
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <div className="h-24 w-full bg-secondary sm:h-32" />
          <div className="px-4 pb-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Avatar className="-mt-10 h-20 w-20 border-4 border-background shadow-md sm:-mt-12 sm:h-24 sm:w-24">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="bg-primary/10 text-3xl">
                  {profile.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="shrink-0 sm:pt-1">
                <FollowButton
                  userId={profile.id}
                  initialFollowing={profile.following}
                  initialFollowers={profile.followersCount ?? 0}
                  size="default"
                  onChanged={(following, followers) => setProfile((current) => current
                    ? { ...current, following, followersCount: followers }
                    : current)}
                />
              </div>
            </div>

            <div className="mt-3">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{profile.name}</h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {profile.location}
                  </span>
                )}
                {profile.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="stat-tile">
              <span className="stat-tile-value">{journalsCount.toLocaleString()}</span>
              <span className="stat-tile-label flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Journals
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-value">
                {(profile.followersCount ?? 0).toLocaleString()}
              </span>
              <span className="stat-tile-label flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Followers
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-value">
                {(profile.followingCount ?? 0).toLocaleString()}
              </span>
              <span className="stat-tile-label flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Following
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Public Journals</h2>
          </div>
          <JournalList
            journals={journals}
            showCreateButton={false}
            emptyMessage="This traveler has not published any public journals yet."
            userMap={{ [profile.id]: profile }}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;
