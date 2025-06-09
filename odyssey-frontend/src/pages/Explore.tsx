
import { useState } from 'react';
import { useJournal } from '@/contexts/JournalContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JournalList from '@/components/journals/JournalList';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { journalApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  useEffect(() => {
      const fetchJournals = async () => {
        try {
          const data = await journalApi.getPublicJournals();
          const filtered = data.filter(journal => journal.userId !== user?.id);
          setDemoJournals(filtered);
        } catch (error) {
          console.error('Error fetching journals:', error);
        }
      };
      fetchJournals();
    }, []);
  
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Travel Journals</h1>
          <p className="text-muted-foreground max-w-3xl">
            Discover travel stories from adventurers around the world. Find inspiration for your next journey.
          </p>
        </div>
        
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Search journals..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex gap-2">
            <div className="w-48">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Locations" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue/>
                  </div>
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
            <JournalList explore='true'
              journals={filteredJournals} 
              emptyMessage="No journals match your filters. Try changing your search criteria."
            />
            
          </>
        )}

      </main>
      <Footer />
    </>
  );
};

export default ExplorePage;

