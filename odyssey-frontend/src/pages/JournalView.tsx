import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { JournalEntry, Comment, User } from '@/types';
import { journalApi, socialApi, accountApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ShareJournal from '@/components/sharing/ShareJournal';
import FollowButton from '@/components/social/FollowButton';
import ReportDialog from '@/components/social/ReportDialog';
import CommentThread from '@/components/comments/CommentThread';
import { useJournal } from '@/contexts/JournalContext';

import Navbar from '@/components/layout/Navbar';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  Edit,
  Globe,
  MapPin,
  MessageCircle,
  Trash,
} from 'lucide-react';

/** Every reaction the API accepts, with the glyph shown in the footer. */
const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'globe', emoji: '🌍', label: 'Globe' },
] as const;

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
  const [reacting, setReacting] = useState<string | null>(null);
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

  const refreshJournal = async () => {
    if (!id) return;
    const updated = await journalApi.getJournalById(id);
    setJournal(updated);
  };

  // Thread replies update in place instead of re-fetching the whole journal, so
  // posting feels immediate and the reading position never jumps.
  const handleCommentAdded = (created: Comment) => {
    setJournal((previous) => previous
      ? { ...previous, comments: [...(previous.comments ?? []), created] }
      : previous);
  };

  const handleCommentRemoved = (commentId: string) => {
    setJournal((previous) => {
      if (!previous) return previous;
      const current = previous.comments ?? [];
      const removed = new Set([
        commentId,
        ...current.filter((comment) => comment.parentId === commentId).map((comment) => comment.id),
      ]);
      return { ...previous, comments: current.filter((comment) => !removed.has(comment.id)) };
    });
  };

  const handleToggleReaction = async (type: string) => {
    if (!id || !journal) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (reacting) return;
    const active = journal.userReactions?.includes(type) ?? false;
    setReacting(type);
    try {
      if (active) {
        await socialApi.removeReaction(id, type);
      } else {
        await socialApi.addReaction(id, type);
      }
      await refreshJournal();
    } catch (reactionError) {
      console.error('Failed to update reaction:', reactionError);
      toast({ variant: 'destructive', description: 'Failed to update reaction.' });
    } finally {
      setReacting(null);
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

  // Reading progress across the article, shown as a thin fixed bar at the top.
  const [readingProgress, setReadingProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const article = document.getElementById('journal-article');
      if (!article) {
        return;
      }
      const start = article.offsetTop;
      const total = article.offsetHeight - window.innerHeight;
      if (total <= 0) {
        setReadingProgress(100);
        return;
      }
      setReadingProgress(Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [journal?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-3 min-h-[50vh]">
            <div className="route-loader" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Loading journal...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12 min-h-[50vh] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Journal not found</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground max-w-md">
              {error || 'This journal may have been removed or is private.'}
            </p>
            <Button asChild size="sm">
              <Link to="/journals">Back to Journals</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?.id === journal.userId;
  const formattedDate = new Date(journal.createdAt).toLocaleDateString();
  const formattedTime = new Date(journal.createdAt).toLocaleTimeString();
  // ~200 words per minute is the usual guide for prose.
  const wordCount = journal.content.trim().split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const authorName = author?.name || journal.userName || 'Anonymous';

  return (
    <div className="min-h-screen bg-background">
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <article id="journal-article" className="select-allow">
            <header>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                {journal.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isOwner && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/journal/edit/${journal.id}`}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteJournal}>
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </>
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
            </header>

            {journal.hidden && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                This journal is hidden from public view after a moderation review. Only you and
                moderators can see it.
              </div>
            )}

            {/* Author byline first, then the quiet reading facts. */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author?.avatar} alt={authorName} />
                  <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>
                  By:{' '}
                  <Link to={`/users/${journal.userId}`} className="font-medium text-foreground hover:text-primary">
                    {authorName}
                  </Link>
                </span>
                <FollowButton
                  userId={journal.userId}
                  initialFollowing={author?.following}
                  initialFollowers={author?.followersCount}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>
                  {readingMinutes} min read · {wordCount.toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                <span>{journal.hidden ? 'Under review' : journal.isPublic ? 'Public' : 'Private'}</span>
              </div>
              {journal.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{journal.location.name || `${journal.location.city || ''}, ${journal.location.country || ''}`}</span>
                </div>
              )}
            </div>

            {journal.tags && journal.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {journal.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <Card className="mt-8 overflow-hidden">
              {journal.images && journal.images.length > 0 && (
                <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden border-b bg-secondary">
                  <img
                    src={journal.images[0]}
                    alt={journal.title}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-5 sm:p-8">
                <div className="prose prose-neutral dark:prose-invert max-w-none prose-lg prose-p:leading-8 prose-a:text-primary">
                  {journal.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>

                {journal.images && journal.images.length > 1 && (
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {journal.images.slice(1).map((image, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-xl border bg-secondary">
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
              <CardFooter className="justify-between gap-4 border-t bg-secondary/40 px-5 py-4 sm:px-8">
                <div className="flex flex-wrap items-center gap-1">
                  {REACTIONS.map((reaction) => {
                    const count = journal.reactions.find((entry) => entry.type === reaction.type)?.count ?? 0;
                    const active = journal.userReactions?.includes(reaction.type) ?? false;
                    return (
                      <Button
                        key={reaction.type}
                        variant={active ? 'secondary' : 'ghost'}
                        size="sm"
                        className="flex items-center gap-1.5"
                        aria-pressed={active}
                        aria-label={`${reaction.label}${count > 0 ? `, ${count}` : ''}`}
                        title={active ? `Remove ${reaction.label.toLowerCase()}` : reaction.label}
                        disabled={reacting === reaction.type}
                        onClick={() => handleToggleReaction(reaction.type)}
                      >
                        <span aria-hidden="true" className="text-base leading-none">
                          {reaction.emoji}
                        </span>
                        <span className="tabular-nums">{count}</span>
                      </Button>
                    );
                  })}
                  <span className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" /> {journal.comments?.length ?? 0}
                  </span>
                </div>

                {journal.location && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${journal.location.latitude},${journal.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4 mr-1.5" /> View on Map
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </article>

          <CommentThread
            journalId={journal.id}
            comments={journal.comments ?? []}
            currentUser={user}
            isAuthenticated={isAuthenticated}
            isJournalOwner={isOwner}
            onCommentAdded={handleCommentAdded}
            onCommentRemoved={handleCommentRemoved}
          />
        </div>
      </main>
    </div>
  );
};

export default JournalView;
