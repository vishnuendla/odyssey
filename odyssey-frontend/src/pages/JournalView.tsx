import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JournalEntry, Comment, User } from '@/types';
import { journalApi, socialApi, accountApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ShareJournal from '@/components/sharing/ShareJournal';
import FollowButton from '@/components/social/FollowButton';
import ReportDialog from '@/components/social/ReportDialog';
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
import {
  Bookmark,
  Calendar,
  Clock,
  Edit,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  ThumbsUp,
  Trash,
  User as UserIcon,
  Loader2,
  CornerDownRight,
} from 'lucide-react';

const setMeta = (property: string, content: string, attr: 'name' | 'property' = 'property') => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const JournalView = () => {
  const { id } = useParams<{ id: string }>();

  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { deleteJournal } = useJournal();

  useEffect(() => {
    const fetchJournal = async () => {
      if (!id) {
        setError('No journal ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const journalData = await journalApi.getJournalById(id);
        setJournal(journalData);

        const fallbackAuthor: User = {
          id: journalData.userId,
          name: journalData.userName || 'Anonymous',
          avatar: journalData.userAvatar,
          email: '',
          createdAt: journalData.createdAt,
        };
        setAuthor(fallbackAuthor);

        // Always resolve the full profile so follow counts and role are real.
        try {
          const authorData = await accountApi.getUser(journalData.userId);
          setAuthor(authorData);
        } catch (authorError) {
          console.error('Failed to fetch author information:', authorError);
        }
      } catch (fetchError) {
        console.error('Failed to fetch journal:', fetchError);
        setError(fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load journal. It may be private or no longer exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [id]);

  useEffect(() => {
    if (!journal) return;

    // Snapshot the route-level defaults so leaving the page restores them
    // instead of leaking this journal's title and preview into the next route.
    const previousTitle = document.title;
    const keys = ['description', 'og:title', 'og:description', 'og:type', 'og:url', 'og:image'];
    const previous = keys.map((key) => {
      const attr = key === 'description' ? 'name' : 'property';
      const element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      return { key, attr, element, content: element?.getAttribute('content') ?? null };
    });

    document.title = `${journal.title} · Odyssey`;
    const description = journal.content.slice(0, 180).replace(/\s+/g, ' ').trim();
    setMeta('description', description, 'name');
    setMeta('og:title', journal.title);
    setMeta('og:description', description);
    setMeta('og:type', 'article');
    setMeta('og:url', window.location.href);
    if (journal.images?.[0]) {
      setMeta('og:image', new URL(journal.images[0], window.location.origin).toString());
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
    }

    return () => {
      document.title = previousTitle;
      for (const entry of previous) {
        if (entry.content === null) {
          entry.element?.remove();
        } else {
          setMeta(entry.key, entry.content, entry.attr as 'name' | 'property');
        }
      }
    };
  }, [journal]);

  const comments = useMemo(() => journal?.comments ?? [], [journal]);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: Comment[] = [];
    const replies: Record<string, Comment[]> = {};
    for (const item of comments) {
      if (!item.parentId) {
        top.push(item);
      } else {
        replies[item.parentId] = [...(replies[item.parentId] ?? []), item];
      }
    }
    return { topLevel: top, repliesByParent: replies };
  }, [comments]);

  const refreshJournal = async () => {
    if (!id) return;
    const updated = await journalApi.getJournalById(id);
    setJournal(updated);
  };

  const handleAddComment = async (parentId?: string) => {
    const content = parentId ? replyText : comment;
    if (!content.trim() || !id || !isAuthenticated) return;

    setSubmitting(true);
    try {
      await socialApi.addComment(id, content, parentId);
      await refreshJournal();
      if (parentId) {
        setReplyText('');
        setReplyTo(null);
      } else {
        setComment('');
      }
      toast({ description: parentId ? 'Reply posted.' : 'Comment added.' });
    } catch (addError) {
      console.error('Failed to add comment:', addError);
      toast({ variant: 'destructive', description: 'Failed to add comment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !window.confirm('Delete this comment and its replies?')) return;
    try {
      await socialApi.deleteComment(id, commentId);
      await refreshJournal();
      toast({ description: 'Comment deleted.' });
    } catch (deleteError) {
      console.error('Failed to delete comment:', deleteError);
      toast({ variant: 'destructive', description: 'Failed to delete comment.' });
    }
  };

  const handleAddReaction = async (type: string) => {
    if (!id || !isAuthenticated) return;
    try {
      await socialApi.addReaction(id, type);
      await refreshJournal();
    } catch (reactionError) {
      console.error('Failed to add reaction:', reactionError);
      toast({ variant: 'destructive', description: 'Failed to add reaction.' });
    }
  };

  const handleToggleBookmark = async () => {
    if (!journal || !id) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const updated = journal.bookmarked
        ? await journalApi.removeBookmark(id)
        : await journalApi.addBookmark(id);
      setJournal(updated);
      toast({
        description: updated.bookmarked ? 'Journal saved to your bookmarks.' : 'Bookmark removed.',
      });
    } catch (bookmarkError) {
      console.error('Failed to update bookmark:', bookmarkError);
      toast({ variant: 'destructive', description: 'Could not update your bookmark. Please try again.' });
    }
  };

  const handleDeleteJournal = async () => {
    if (!id || !journal || journal.userId !== user?.id) return;

    if (window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      try {
        await deleteJournal(id);
        toast({ description: 'Journal deleted successfully' });
        navigate('/journals');
      } catch (deleteError) {
        console.error('Failed to delete journal:', deleteError);
        toast({ variant: 'destructive', description: 'Failed to delete journal' });
      }
    }
  };

  if (loading) {
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

  const isOwner = user?.id === journal.userId;
  const canModerate = isOwner || user?.role === 'ADMIN';
  const formattedDate = new Date(journal.createdAt).toLocaleDateString();
  const formattedTime = new Date(journal.createdAt).toLocaleTimeString();

  const commentCard = (item: Comment, isReply = false) => (
    <Card key={item.id} className={isReply ? 'ml-8 border-l-2' : ''}>
      <CardHeader className="py-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={item.userAvatar} alt={item.userName || 'User'} />
            <AvatarFallback>{item.userName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">
              <Link to={`/users/${item.userId}`} className="hover:text-primary">
                {item.userName || 'Anonymous'}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {isAuthenticated && !isReply && (
            <Button variant="ghost" size="sm" onClick={() => {
              setReplyTo(replyTo?.id === item.id ? null : item);
              setReplyText('');
            }}>
              <CornerDownRight className="mr-1 h-3 w-3" /> Reply
            </Button>
          )}
          {(user?.id === item.userId || canModerate) && (
            <Button variant="ghost" size="icon" onClick={() => handleDeleteComment(item.id)} aria-label="Delete comment">
              <Trash className="h-4 w-4" />
            </Button>
          )}
          {!isOwner && user?.id !== item.userId && (
            <ReportDialog targetType="COMMENT" targetId={item.id} label="" />
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <p className="whitespace-pre-wrap">{item.content}</p>
      </CardContent>
      {replyTo?.id === item.id && (
        <CardContent className="space-y-2 pt-0">
          <Textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder={`Reply to ${item.userName || 'this comment'}...`}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAddComment(item.id)} disabled={!replyText.trim() || submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Post reply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyText(''); }}>
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
            <h1 className="text-3xl font-bold">{journal.title}</h1>
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
              {isAuthenticated && journal.isPublic && (
                <Button variant="outline" size="sm" onClick={handleToggleBookmark}>
                  <Bookmark className={`h-4 w-4 mr-2 ${journal.bookmarked ? 'fill-current' : ''}`} />
                  {journal.bookmarked ? 'Saved' : 'Save'}
                </Button>
              )}
              {!isOwner && (
                <ReportDialog targetType="JOURNAL" targetId={journal.id} />
              )}
              <ShareJournal journalId={journal.id} title={journal.title} />
            </div>
          </div>

          {journal.hidden && (
            <div
              role="status"
              className="mb-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
            >
              This journal is hidden from public view after a moderation review. Only you and
              moderators can see it.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>
                By:{' '}
                <Link to={`/users/${journal.userId}`} className="font-medium text-foreground hover:text-primary">
                  {author?.name || journal.userName || 'Anonymous'}
                </Link>
              </span>
              <FollowButton
                userId={journal.userId}
                initialFollowing={author?.following}
                initialFollowers={author?.followersCount}
              />
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              <span>{journal.hidden ? 'Under review' : journal.isPublic ? 'Public' : 'Private'}</span>
            </div>
            {journal.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}</span>
              </div>
            )}
          </div>

          {journal.tags && journal.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {journal.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/explore?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <Card className="mb-8">
            {journal.images && journal.images.length > 0 && (
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={journal.images[0]}
                  alt={journal.title}
                  loading="eager"
                  decoding="async"
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
                        loading="lazy"
                        decoding="async"
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
                  <Button variant="ghost" size="sm" onClick={() => handleAddReaction('like')} className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{journal.reactions.find((reaction) => reaction.type === 'like')?.count || 0}</span>
                  </Button>
                )}
                {isAuthenticated && (
                  <Button variant="ghost" size="sm" onClick={() => handleAddReaction('love')} className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{journal.reactions.find((reaction) => reaction.type === 'love')?.count || 0}</span>
                  </Button>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" /> {comments.length}
                </span>
              </div>

              {journal.location && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${journal.location.latitude},${journal.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4 mr-1" /> View on Map
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Comments</h2>

          {isAuthenticated ? (
            <div className="mb-6">
              <Textarea
                placeholder="Write a comment..."
                className="mb-2"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <Button onClick={() => handleAddComment()} disabled={!comment.trim() || submitting}>
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

          {topLevel.length > 0 ? (
            <div className="space-y-4">
              {topLevel.map((item) => (
                <div key={item.id} className="space-y-3">
                  {commentCard(item)}
                  {(repliesByParent[item.id] ?? []).map((reply) => commentCard(reply, true))}
                </div>
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
