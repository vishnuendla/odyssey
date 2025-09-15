
import React from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, Calendar } from 'lucide-react';
import { JournalEntry } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

interface TimelineProps {
  journals: JournalEntry[];
}

const Timeline: React.FC<TimelineProps> = ({ journals }) => {
  const navigate = useNavigate();
  
  const sortedJournals = [...journals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleJournalClick = (id: string) => {
    navigate(`/journals/${id}`);
  };

  // Group journals by month and year
  const journalsByMonthYear = sortedJournals.reduce((acc, journal) => {
    const date = new Date(journal.createdAt);
    const monthYear = format(date, 'MMMM yyyy');
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(journal);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <div className="space-y-12">
      {Object.entries(journalsByMonthYear).map(([monthYear, monthJournals], monthIndex) => (
        <div key={monthYear} className="relative">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-4 border-b">
            <h3 className="text-xl font-bold text-primary">{monthYear}</h3>
          </div>
          
          <div className="space-y-8 relative">
            {/* Desktop timeline line - center */}
            <div className="hidden md:block absolute left-[calc(50%-1px)] top-0 bottom-0 w-0.5 bg-border"></div>
            {/* Mobile timeline line - left side */}
            <div className="block md:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            
            {monthJournals.map((journal, index) => {
              const date = new Date(journal.createdAt);
              const formattedDate = format(date, 'dd');
              const formattedDay = format(date, 'EEEE');
              const isEven = index % 2 === 0;
              
              return (
                <div key={journal.id} className="relative">
                  {/* Desktop layout - alternating sides */}
                  <div className={`hidden md:flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Timeline node */}
                    <div className="absolute left-[calc(50%-12px)] w-6 h-6 rounded-full bg-primary z-10 shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-background"></div>
                    </div>
                    
                    {/* Date column */}
                    <div className={`w-1/2 ${isEven ? 'pr-12 text-right' : 'pl-12'}`}>
                      <div className={`inline-block ${isEven ? 'mr-4' : 'ml-4'}`}>
                        <div className="text-4xl font-bold text-primary">{formattedDate}</div>
                        <div className="text-sm text-muted-foreground">{formattedDay}</div>
                        <div className="text-xs flex items-center mt-1 text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(date, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Journal card column */}
                    <div className={`w-1/2 ${isEven ? 'pl-12' : 'pr-12'}`}>
                      <Card 
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] hover:translate-y-[-2px]"
                        onClick={() => handleJournalClick(journal.id)}
                      >
                        {journal.images && journal.images.length > 0 && (
                          <div className="w-full h-32 overflow-hidden">
                            <img 
                              src={journal.images[0]} 
                              alt={journal.title} 
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{journal.title}</h3>
                            <Badge variant={journal.isPublic ? "outline" : "secondary"}>
                              {journal.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          
                          {journal.location && (
                            <div className="flex items-center text-sm font-medium mb-2">
                              <MapPin className="h-4 w-4 mr-1 text-primary" />
                              <span>
                                {journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-sm line-clamp-2 mt-2 text-muted-foreground">
                            {journal.content}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Mobile layout - single column */}
                  <div className="block md:hidden">
                    {/* Timeline node */}
                    <div className="absolute left-3 w-6 h-6 rounded-full bg-primary z-10 shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-background"></div>
                    </div>
                    
                    <div className="ml-12 pl-4">
                      {/* Date section */}
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-primary">{formattedDate}</div>
                        <div className="text-xs text-muted-foreground">{formattedDay}</div>
                        <div className="text-xs flex items-center mt-1 text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(date, 'h:mm a')}
                        </div>
                      </div>
                      
                      {/* Journal card */}
                      <Card 
                        className="overflow-hidden hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleJournalClick(journal.id)}
                      >
                        {journal.images && journal.images.length > 0 && (
                          <div className="w-full h-24 overflow-hidden">
                            <img 
                              src={journal.images[0]} 
                              alt={journal.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm truncate">{journal.title}</h3>
                            <Badge variant={journal.isPublic ? "outline" : "secondary"} className="text-xs">
                              {journal.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          
                          {journal.location && (
                            <div className="flex items-center text-xs font-medium mb-2">
                              <MapPin className="h-3 w-3 mr-1 text-primary flex-shrink-0" />
                              <span className="truncate">
                                {journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-xs line-clamp-2 mt-2 text-muted-foreground">
                            {journal.content}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
                    