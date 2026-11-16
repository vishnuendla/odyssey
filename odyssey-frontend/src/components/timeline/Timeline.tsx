
import React from 'react';
import { format } from 'date-fns';
import { MapPin, Globe2, Lock } from 'lucide-react';
import { JournalEntry } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';

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

  const handleJournalKeyDown = (event: React.KeyboardEvent, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleJournalClick(id);
    }
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

  const JournalCardBody = ({ journal, compact }: { journal: JournalEntry; compact?: boolean }) => (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Open journal: ${journal.title}`}
      onKeyDown={(event) => handleJournalKeyDown(event, journal.id)}
      className="card-lift group cursor-pointer overflow-hidden rounded-xl border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => handleJournalClick(journal.id)}
    >
      {journal.images && journal.images.length > 0 ? (
        <div className={cn('w-full overflow-hidden', compact ? 'h-28' : 'h-40')}>
          <img
            src={journal.images[0]}
            alt={journal.title}
            width={800}
            height={400}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className={cn('flex w-full items-center justify-center bg-secondary', compact ? 'h-16' : 'h-20')}>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <CardContent className={cn('space-y-2', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn('font-semibold leading-snug tracking-tight', compact ? 'text-sm' : 'text-base')}>
            {journal.title}
          </h3>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
              journal.isPublic
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-accent/10 text-accent-foreground'
            )}
          >
            {journal.isPublic ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {journal.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        {journal.location && (
          <div className={cn('flex items-center font-medium text-primary', compact ? 'text-xs' : 'text-sm')}>
            <MapPin className={cn('mr-1 shrink-0', compact ? 'h-3 w-3' : 'h-4 w-4')} />
            <span className="truncate">
              {journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}
            </span>
          </div>
        )}

        <p className={cn('line-clamp-2 text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {journal.content}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-12">
      {Object.entries(journalsByMonthYear).map(([monthYear, monthJournals]) => (
        <div key={monthYear} className="relative">
          <div className="sticky top-16 z-10 -mx-1 border-b bg-background/95 px-1 py-2 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-primary">{monthYear}</h3>
          </div>
          
          <div className="relative mt-6 space-y-8">
            {/* Desktop timeline line - center */}
            <div className="hidden md:block absolute left-[calc(50%-1px)] top-0 bottom-0 w-px bg-border"></div>
            {/* Mobile timeline line - left side */}
            <div className="block md:hidden absolute left-[11px] top-0 bottom-0 w-px bg-border"></div>
            
            {monthJournals.map((journal, index) => {
              const date = new Date(journal.createdAt);
              const formattedDate = format(date, 'dd');
              const formattedMonth = format(date, 'MMM');
              const isEven = index % 2 === 0;
              
              return (
                <div key={journal.id} className="relative">
                  {/* Desktop layout - alternating sides */}
                  <div className={`hidden md:flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Timeline node */}
                    <div className="absolute left-[calc(50%-7px)] h-3.5 w-3.5 rounded-full border-2 border-primary bg-background z-10">
                    </div>
                    
                    {/* Date column */}
                    <div className={`w-1/2 ${isEven ? 'pr-10 text-right' : 'pl-10'}`}>
                      <div className={`inline-block ${isEven ? 'mr-2' : 'ml-2'}`}>
                        <div className="font-display text-3xl font-semibold text-foreground">{formattedDate}</div>
                        <div className="text-sm text-muted-foreground">
                          {formattedMonth} · {format(date, 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Journal card column */}
                    <div className={`w-1/2 ${isEven ? 'pl-10' : 'pr-10'}`}>
                      <JournalCardBody journal={journal} />
                    </div>
                  </div>

                  {/* Mobile layout - single column */}
                  <div className="block md:hidden">
                    {/* Timeline node */}
                    <div className="absolute left-[11px] h-3 w-3 -translate-x-[4px] rounded-full border-2 border-primary bg-background z-10">
                    </div>
                    
                    <div className="ml-8 pl-2">
                      {/* Date section */}
                      <div className="mb-3">
                        <div className="font-display text-xl font-semibold text-foreground">{formattedDate}</div>
                        <div className="text-xs text-muted-foreground">
                          {formattedMonth} · {format(date, 'h:mm a')}
                        </div>
                      </div>
                      
                      {/* Journal card */}
                      <JournalCardBody journal={journal} compact />
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

                    