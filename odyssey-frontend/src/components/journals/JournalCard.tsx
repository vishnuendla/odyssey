import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { JournalEntry } from '@/types';

interface JournalCardProps {
  journal: JournalEntry;
  userName: string;
  userAvatar?: string;
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
  userAvatar
}: JournalCardProps) => {
  const reactionCount = journal.reactions?.reduce((acc, r) => acc + r.count, 0) ?? 0;
  const commentCount = journal.comments?.length ?? 0;
  const coverImage = journal.images?.[0] || '/placeholder-journal.jpg';

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden border transition-all duration-200 hover:shadow-lg">
      <Link to={`/journals/${journal.id}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <OptimizedImage
            src={coverImage}
            alt={journal.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-2">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
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

        <Link to={`/journals/${journal.id}`} className="block">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{journal.title}</h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {journal.content}
          </p>
        </Link>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
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
          {journal.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{journal.location.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

JournalCard.displayName = 'JournalCard';

export default JournalCard;
