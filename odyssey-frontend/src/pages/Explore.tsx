import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppPage from '@/components/layout/AppPage';
import JournalList from '@/components/journals/JournalList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { journalApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import ContentLoader from '@/components/shared/ContentLoader';
import { readListCache, writeListCache } from '@/lib/listCache';
import { JournalEntry, User } from '@/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'recent' | 'oldest' | 'popular';

const PAGE_SIZE = 12;

type ExplorePageResult = {
  content: JournalEntry[];
  totalElements: number;
  totalPages: number;
};

type ExploreQuery = {
  q?: string;
  tag?: string;
  location?: string;
  sort: SortOption;
  page: number;
};

const EXPLORE_CACHE = 'explore:page';
const EXPLORE_TAGS = 'explore:tags';
const EXPLORE_LOCATIONS = 'explore:locations';

// Stale-while-revalidate cache so returning to Explore renders instantly
// instead of flashing placeholder cards on every tab switch.
const pageCache = new Map<string, ExplorePageResult>();

const cacheKeyFor = (query: ExploreQuery) =>
  JSON.stringify({
    q: query.q,
    tag: query.tag,
    location: query.location,
    sort: query.sort === 'popular' ? 'recent' : query.sort,
    page: query.page,
  });

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [page, setPage] = useState(0);

  // Hydrate the very first paint from the cached page matching the filters
  // this mount starts with. Reading the cache in an effect (as before) left
  // one frame of placeholder cards on every revisit.
  const [initialResult] = useState<ExplorePageResult | null>(() => {
    const key = cacheKeyFor({
      tag: searchParams.get('tag') || undefined,
      sort: 'recent',
      page: 0,
    });
    const cached = pageCache.get(key) ?? readListCache<ExplorePageResult>(`${EXPLORE_CACHE}:${key}`);
    if (cached) {
      pageCache.set(key, cached);
    }
    return cached;
  });

  const [journals, setJournals] = useState<JournalEntry[]>(initialResult?.content ?? []);
  const [totalElements, setTotalElements] = useState(initialResult?.totalElements ?? 0);
  const [totalPages, setTotalPages] = useState(initialResult?.totalPages ?? 0);
  const [popularTags, setPopularTags] = useState<string[]>(
    () => readListCache<string[]>(EXPLORE_TAGS) ?? []
  );
  const [locationOptions, setLocationOptions] = useState<string[]>(
    () => readListCache<string[]>(EXPLORE_LOCATIONS) ?? []
  );
  const [isLoading, setIsLoading] = useState(initialResult === null);
  const { user } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    journalApi
      .getPopularTags()
      .then((tags) => {
        setPopularTags(tags);
        writeListCache(EXPLORE_TAGS, tags);
      })
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
        writeListCache(EXPLORE_LOCATIONS, names);
      })
      .catch((error) => console.error('Error fetching locations:', error));
  }, []);

  // Any change to the search criteria starts again from the first page.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, tagFilter, locationFilter, sortBy]);

  useEffect(() => {
    let cancelled = false;

    const fetchJournals = async () => {
      const cacheKey = cacheKeyFor({
        q: debouncedSearch.trim() || undefined,
        tag: tagFilter || undefined,
        location: locationFilter === 'all' ? undefined : locationFilter,
        sort: sortBy,
        page,
      });

      const applyResult = (content: JournalEntry[], total: number, pages: number) => {
        let entries = content;
        if (sortBy === 'popular') {
          const countReactions = (journal: JournalEntry) =>
            journal.reactions?.reduce((acc, reaction) => acc + reaction.count, 0) ?? 0;
          entries = [...entries].sort((a, b) => countReactions(b) - countReactions(a));
        }
        setJournals(entries);
        setTotalElements(total);
        setTotalPages(pages);
      };

      // Render the cached result immediately; refresh in the background.
      const cached =
        pageCache.get(cacheKey) ?? readListCache<ExplorePageResult>(`${EXPLORE_CACHE}:${cacheKey}`);
      if (cached) {
        pageCache.set(cacheKey, cached);
        applyResult(cached.content, cached.totalElements, cached.totalPages);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await journalApi.searchPublicJournalsPage({
          q: debouncedSearch.trim() || undefined,
          tag: tagFilter || undefined,
          location: locationFilter === 'all' ? undefined : locationFilter,
          sort: sortBy === 'popular' ? 'recent' : sortBy,
          page,
          size: PAGE_SIZE,
        });

        if (cancelled) return;

        const payload: ExplorePageResult = {
          content: result.content,
          totalElements: result.totalElements,
          totalPages: result.totalPages,
        };
        pageCache.set(cacheKey, payload);
        writeListCache(`${EXPLORE_CACHE}:${cacheKey}`, payload);
        applyResult(payload.content, payload.totalElements, payload.totalPages);
      } catch (error) {
        console.error('Error fetching journals:', error);
        if (!cancelled) {
          setJournals([]);
          setTotalElements(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchJournals();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, tagFilter, locationFilter, sortBy, page, user?.id]);

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
      <AppPage
        eyebrow="Explore"
        title="Discover travel stories"
        description="Photo-led journals from everywhere — filter by place, tag, or what’s trending."
      >
        <div className="sticky top-[4.5rem] z-30 mb-6 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
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
            <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
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
                    : 'bg-card hover:bg-accent'
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
          <ContentLoader label="Loading journals…" />
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Found {totalElements} {totalElements === 1 ? 'journal' : 'journals'}
              {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
            </div>
            <JournalList
              journals={journals}
              paginate={false}
              showCreateButton={false}
              emptyMessage="No journals match your filters. Try changing your search criteria."
              userMap={userMap}
              layout="masonry"
            />

            {totalPages > 1 && (
              <nav aria-label="Journal pages" className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0 || isLoading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground" aria-current="page">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1 || isLoading}
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </AppPage>
  );
};

export default ExplorePage;
