import { useState, useEffect } from 'react';
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { journalApi, accountApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ExplorePage = () => {
  const { journals, isLoading } = useJournal();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [demoJournals, setDemoJournals] = useState([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        console.log('Fetching public journals for Explore page...');
        const data = await journalApi.getPublicJournals();
        console.log('Public journals data:', data);
        const filtered = data.filter(journal => journal.userId !== user?.id);
        console.log('Filtered journals (excluding user journals):', filtered);
        setDemoJournals(filtered);

        // Fetch user information for all unique authors
        const userIds = [...new Set(filtered.map(journal => journal.userId))];
        const userInfoPromises = userIds.map(async (userId) => {
          try {
            const userInfo = await accountApi.getUser(userId);
            return { id: userId, ...userInfo };
          } catch (error) {
            console.error(`Failed to fetch user info for ${userId}:`, error);
            return { id: userId, name: 'Anonymous' };
          }
        });

        const userInfos = await Promise.all(userInfoPromises);
        const newUserMap = userInfos.reduce((acc, user) => ({
          ...acc,
          [user.id]: user
        }), {});
        
        setUserMap(newUserMap);
      } catch (error) {
        console.error('Error fetching journals:', error);
      }
    };
    fetchJournals();
  }, [user?.id]);
  
  const publicJournals = demoJournals;
  
  const countries = Array.from(new Set(
    publicJournals
      .map(journal => journal.location?.name)
      .filter(Boolean)
  )).sort();
  
  const filteredJournals = publicJournals
    .filter(journal => {
      const combinedText = [
        journal.title,
        journal.location?.name,
        journal.location?.city,
        journal.location?.country
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = searchTerm.trim() === '' || 
        combinedText.includes(searchTerm.toLowerCase());

      const matchesLocation = locationFilter === 'all' || 
        journal.location?.name === locationFilter;

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'popular') {
        const countReactions = (journal) => 
          journal.reactions?.reduce((acc, r) => acc + r.count, 0) ?? 0;
        return countReactions(b) - countReactions(a);
      }
      return 0;
    });

  return (
    <>
      <Navbar />
      <main className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Explore Journals</h1>
            <p className="text-muted-foreground">
              Discover travel stories from around the world
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search journals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
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
              Found {filteredJournals.length} {filteredJournals.length === 1 ? 'journal' : 'journals'}
            </div>
            <JournalList 
              explore='true'
              journals={filteredJournals} 
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

