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
    <Link to={`/journals/${journal.id}`} className="block">
      <div className="group relative bg-card rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 h-full">
        <div className={`relative overflow-hidden ${masonry ? 'max-h-[420px]' : 'aspect-[16/9]'}`}>
          <OptimizedImage
            src={coverImage}
            alt={journal.title}
            aspectRatio={masonry ? 'auto' : 'video'}
            className={`object-cover w-full transition-transform duration-500 group-hover:scale-105 ${masonry ? 'h-auto' : 'h-full'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleBookmark}
            disabled={savingBookmark}
            aria-label={bookmarked ? 'Remove bookmark' : 'Save journal'}
            className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full shadow opacity-90 transition-opacity group-hover:opacity-100"
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

        <div className="p-4">
          <div className="flex items-center mb-3">
            <div className="flex items-center space-x-2">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  loading="lazy"
                  decoding="async"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {getInitials(userName)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">By: {userName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(journal.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <h3 className="font-display text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{journal.title}</h3>

          {journal.tags && journal.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {journal.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {journal.content}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{reactionCount}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{commentCount}</span>
              </div>
            </div>
            {journal.location && !masonry && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="truncate">{journal.location.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

JournalCard.displayName = 'JournalCard';

export default JournalCard;
