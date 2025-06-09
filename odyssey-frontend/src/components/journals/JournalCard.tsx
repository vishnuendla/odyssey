import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { JournalEntry } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, MapPin, Globe } from 'lucide-react';
import ShareJournal from '@/components/sharing/ShareJournal';

interface JournalCardProps {
  journal: JournalEntry;
  userName?: string;
  userAvatar?: string;
}

export default function JournalCard({ journal, userName, userAvatar }: JournalCardProps) {
  const formattedDate = format(new Date(journal.createdAt), 'MMM d, yyyy');
  
  // Calculate total reactions
  const totalReactions = journal.reactions.reduce((acc, reaction) => acc + reaction.count, 0);
  
  
  return (
    <Link to={`/journals/${journal.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="aspect-[16/9] overflow-hidden relative">
          {journal.images && journal.images.length > 0 ? (
            <img
              src={journal.images[0]}
              alt={journal.title}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Globe className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          )}
          {journal.location && (
            <div className="absolute bottom-2 left-2 flex items-center bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {journal.location.name}
            </div>
          )}
        </div>
        
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg line-clamp-1">{journal.title}</h3>
            {journal.isPublic ? (
              <Badge variant="outline" className="ml-2 shrink-0">Public</Badge>
            ) : (
              <Badge variant="outline" className="ml-2 shrink-0">Private</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-1 flex-grow">
          <p className="text-muted-foreground text-sm line-clamp-3">{journal.content}</p><br/>
        </CardContent>
        
        
        <CardFooter className="p-4 pt-2 border-t flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={userAvatar} />
              <AvatarFallback>{userName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">{formattedDate}</div>
          </div>
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="flex items-center text-xs">
              <Heart className="h-3.5 w-3.5 mr-1" />
              <span>{totalReactions}</span>
            </div>
            <div className="flex items-center text-xs">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span>{journal.comments?.length || 0}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
