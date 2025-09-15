import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JournalEntry, Comment, User } from '@/types';
import { journalApi, socialApi, accountApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ShareJournal from '@/components/sharing/ShareJournal';
import { useJournal } from '@/contexts/JournalContext';

import Navbar from '@/components/layout/Navbar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Globe, 
  Heart, 
  MapPin, 
  ThumbsUp, 
  Trash, 
  User as UserIcon,
  Loader2 
} from 'lucide-react';

const API_BASE_URL = '/api';

const JournalView = () => {
  console.log('JournalView component rendering');
  const { id } = useParams<{ id: string }>();
  console.log('Journal ID from params:', id);
  
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { deleteJournal } = useJournal();

  useEffect(() => {
    console.log('useEffect triggered');
    const fetchJournal = async () => {
      if (!id) {
        console.log('No ID provided');
        setError('No journal ID provided');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching journal with ID:', id);
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/journals/${id}`, {
          credentials: 'include'
        });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to load journal' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const journalData = await response.json();
        console.log('Journal data received:', journalData);
        setJournal(journalData);
        
        // Fetch author information
        try {
          const authorData = await accountApi.getUser(journalData.userId);
          setAuthor(authorData);
        } catch (error) {
          console.error('Failed to fetch author information:', error);
          setAuthor(null);
        }
      } catch (error) {
        console.error('Failed to fetch journal:', error);
        setError(error instanceof Error ? error.message : 'Failed to load journal. It may be private or no longer exist.');
        toast({
          variant: "destructive",
          description: error instanceof Error ? error.message : 'Failed to load journal. It may be private or no longer exist.',
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchJournal();
  }, [id, toast]);

  const handleViewMap = () => {
    if (!journal?.location) return;
    
    const { latitude, longitude } = journal.location;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(mapUrl, '_blank');
  };
  
  const handleAddComment = async () => {
    if (!comment.trim() || !id || !isAuthenticated) return;
    
    setSubmitting(true);
    try {
      await socialApi.addComment(id, comment);
      
      const updatedJournal = await journalApi.getJournalById(id);
      setJournal(updatedJournal);
      setComment('');
      
      toast({
        description: 'Comment added successfully',
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        variant: "destructive",
        description: 'Failed to add comment',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReaction = async (type: string) => {
    if (!id || !isAuthenticated) return;
    
    try {
      await socialApi.addReaction(id, type);
      
      const updatedJournal = await journalApi.getJournalById(id);
      setJournal(updatedJournal);
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast({
        variant: "destructive",
        description: 'Failed to add reaction',
      });
    }
  };

  const handleDeleteJournal = async () => {
    if (!id || !journal || journal.userId !== user?.id) return;
    
    if (window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      try {
        await deleteJournal(id);
        toast({
          description: 'Journal deleted successfully',
        });
        navigate('/journals');
      } catch (error) {
        console.error('Failed to delete journal:', error);
        toast({
          variant: "destructive",
          description: 'Failed to delete journal',
        });
      }
    }
  };

  console.log('Current state:', { loading, error, journal });

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p>Loading journal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !journal) {
    console.log('Rendering error state:', error);
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col justify-center items-center min-h-[50vh]">
            <h1 className="text-2xl font-bold mb-4">Journal not found</h1>
            <p className="mb-6">{error || 'This journal may have been removed or is private.'}</p>
            <Button asChild>
              <Link to="/journals">Back to Journals</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering journal content');
  const isOwner = user?.id === journal.userId;
  const formattedDate = new Date(journal.createdAt).toLocaleDateString();
  const formattedTime = new Date(journal.createdAt).toLocaleTimeString();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Journal header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">{journal.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/journal/edit/${journal.id}`}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteJournal}>
                    <Trash className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              )}
              <ShareJournal journalId={journal.id} title={journal.title} />
            </div>
          </div>
          
          {/* Journal metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>By: {author?.name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              <span>{journal.isPublic ? 'Public' : 'Private'}</span>
            </div>
            {journal.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}</span>
              </div>
            )}
          </div>
          
          {/* Journal content */}
          <Card className="mb-8">
            {journal.images && journal.images.length > 0 && (
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img 
                  src={journal.images[0]} 
                  alt={journal.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                {journal.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
              
              {journal.images && journal.images.length > 1 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {journal.images.slice(1).map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-md">
                      <img 
                        src={image} 
                        alt={`${journal.title} - ${index + 2}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-4">
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAddReaction('like')}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>
                      {journal.reactions.find(r => r.type === 'like')?.count || 0}
                    </span>
                  </Button>
                )}
                {isAuthenticated && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAddReaction('love')}
                    className="flex items-center gap-1"
                  >
                    <Heart className="h-4 w-4" />
                    <span>
                      {journal.reactions.find(r => r.type === 'love')?.count || 0}
                    </span>
                  </Button>
                )}
              </div>
              
              {journal.location && (
                <Button onClick={handleViewMap} variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-1" /> View on Map
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Comments section */}
          <h2 className="text-2xl font-bold mb-4">Comments</h2>
          
          {isAuthenticated ? (
            <div className="mb-6">
              <Textarea
                placeholder="Write a comment..."
                className="mb-2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button 
                onClick={handleAddComment} 
                disabled={!comment.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : 'Post Comment'}
              </Button>
            </div>
          ) : (
            <Card className="mb-6">
              <CardContent className="py-4">
                <p>Please <Link to="/login" className="text-primary">log in</Link> to leave a comment.</p>
              </CardContent>
            </Card>
          )}
          
          {journal.comments && journal.comments.length > 0 ? (
            <div className="space-y-4">
              {journal.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName || 'User'} />
                        <AvatarFallback>{comment.userName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-medium">{comment.userName || 'Anonymous'}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p>{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalView;