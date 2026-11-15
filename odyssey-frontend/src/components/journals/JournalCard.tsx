import React, { memo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bookmark, Heart, MessageCircle, MapPin } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { journalApi } from '@/services/api';
import { JournalEntry } from '@/types';

interface JournalCardProps {
  journal: JournalEntry;
  userName: string;
  userAvatar?: string;
  /** Masonry cards let the cover image keep its natural shape. */
  masonry?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

const JournalCard = memo(({ 
  journal, 
  userName, 
  userAvatar,
  masonry = false,
}: JournalCardProps) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(journal.bookmarked ?? false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  useEffect(() => {
    setBookmarked(journal.bookmarked ?? false);
  }, [journal.bookmarked]);

  const reactionCount = journal.reactions?.reduce((acc, r) => acc + r.count, 0) ?? 0;
  const commentCount = journal.comments?.length ?? 0;
  const coverImage = journal.images?.[0] || '/placeholder.svg';

  const handleBookmark = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (savingBookmark) return;

    setSavingBookmark(true);
    try {
      const updated = bookmarked
        ? await journalApi.removeBookmark(journal.id)
        : await journalApi.addBookmark(journal.id);
      setBookmarked(updated.bookmarked ?? !bookmarked);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      toast({
        variant: 'destructive',
        description: 'Could not update your bookmarks. Please try again.',
      });
    } finally {
      setSavingBookmark(false);
    }
  };

  return (
    <Link to={`/journals/${journal.id}`} className="block h-full">
      <article className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className={`relative overflow-hidden ${masonry ? 'max-h-[420px]' : ''}`}>
          <OptimizedImage
            src={coverImage}
            alt={journal.title}
            aspectRatio={masonry ? 'auto' : 'landscape'}
            className={`object-cover w-full ${masonry ? 'h-auto' : 'h-full'}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleBookmark}
            disabled={savingBookmark}
            aria-label={bookmarked ? 'Remove bookmark' : 'Save journal'}
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full border bg-background/90 shadow-sm backdrop-blur-sm transition-opacity group-hover:bg-background"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current text-primary' : ''}`} />
          </Button>
          {journal.location && masonry && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              <MapPin className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{journal.location.name}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                loading="lazy"
                decoding="async"
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <span className="text-xs font-semibold text-secondary-foreground">
                  {getInitials(userName)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">By: {userName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(journal.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <h3 className="font-display text-lg font-semibold tracking-tight line-clamp-2 transition-colors group-hover:text-primary">
            {journal.title}
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-muted-foreground line-clamp-1">
            {journal.content}
          </p>

          {journal.tags && journal.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {journal.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-transparent bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-col pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                {reactionCount}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                {commentCount}
              </span>
            </div>
            {journal.location && !masonry && (
              <span className="mt-2 flex items-center gap-1.5 sm:mt-0">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{journal.location.name}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});

JournalCard.displayName = 'JournalCard';

export default JournalCard;
