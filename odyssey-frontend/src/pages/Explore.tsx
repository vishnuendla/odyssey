import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { journalApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { JournalEntry, User } from '@/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'recent' | 'oldest' | 'popular';

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    journalApi
      .getPopularTags()
      .then(setPopularTags)
      .catch((error) => console.error('Error fetching tags:', error));
  }, []);

  // Build the location filter options once from the widest public listing.
  useEffect(() => {
    journalApi
      .searchPublicJournals({ size: 100 })
      .then((data) => {
        const names = Array.from(
          new Set(data.map((journal) => journal.location?.name).filter(Boolean))
        ).sort() as string[];
        setLocationOptions(names);
      })
      .catch((error) => console.error('Error fetching locations:', error));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchJournals = async () => {
      setIsLoading(true);
      try {
        const data = await journalApi.searchPublicJournals({
          q: debouncedSearch.trim() || undefined,
          tag: tagFilter || undefined,
          location: locationFilter === 'all' ? undefined : locationFilter,
          sort: sortBy === 'popular' ? 'recent' : sortBy,
          size: 100,
        });

        if (cancelled) return;

        let filtered = data.filter((journal) => journal.userId !== user?.id);
        if (sortBy === 'popular') {
          const countReactions = (journal: JournalEntry) =>
            journal.reactions?.reduce((acc, reaction) => acc + reaction.count, 0) ?? 0;
          filtered = [...filtered].sort((a, b) => countReactions(b) - countReactions(a));
        }

        setJournals(filtered);
      } catch (error) {
        console.error('Error fetching journals:', error);
        if (!cancelled) setJournals([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJournals();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, tagFilter, locationFilter, sortBy, user?.id]);

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    for (const journal of journals) {
      if (journal.userName) {
        map[journal.userId] = {
          id: journal.userId,
          name: journal.userName,
          avatar: journal.userAvatar,
          email: '',
          createdAt: '',
        };
      }
    }
    return map;
  }, [journals]);

  const locations = useMemo(() => {
    const names = new Set(locationOptions);
    for (const journal of journals) {
      if (journal.location?.name) names.add(journal.location.name);
    }
    return Array.from(names).sort();
  }, [locationOptions, journals]);

  const selectTag = (tag: string) => {
    const next = tagFilter === tag ? '' : tag;
    setTagFilter(next);

    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('tag', next);
    } else {
      params.delete('tag');
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <>
      <Navbar />
      <main className="container py-6 sm:py-12 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Explore Journals</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Discover travel stories from around the world
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search journals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {popularTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Popular tags:</span>
            {popularTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => selectTag(tag)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  tagFilter === tag
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                #{tag}
              </button>
            ))}
            {tagFilter && (
              <Button variant="ghost" size="sm" onClick={() => selectTag(tagFilter)}>
                <X className="mr-1 h-4 w-4" />
                Clear tag
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Found {journals.length} {journals.length === 1 ? 'journal' : 'journals'}
            </div>
            <JournalList
              explore="true"
              journals={journals}
              emptyMessage="No journals match your filters. Try changing your search criteria."
              userMap={userMap}
            />
          </>
        )}
      </main>
      <Footer />
    </>
  );
};

export default ExplorePage;
