import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  ImagePlus,
  Loader2,
  MessageCircle,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import type { Comment, CommentAttachment, CommentMediaType, User } from '@/types';
import {
  COMMENT_MEDIA_ACCEPT,
  MAX_COMMENT_MEDIA,
  commentMediaKind,
  socialApi,
  validateCommentMediaFiles,
} from '@/services/api';
import { commentMediaLabel, formatCommentTime, parseCommentTime } from '@/utils/comments';
import { useToast } from '@/hooks/use-toast';
import ReportDialog from '@/components/social/ReportDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommentThreadProps {
  journalId: string;
  comments: Comment[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isJournalOwner: boolean;
  onCommentAdded: (comment: Comment) => void;
  onCommentRemoved: (commentId: string) => void;
}

interface DraftAttachment {
  key: string;
  previewUrl: string;
  url: string | null;
  type: CommentMediaType;
  uploading: boolean;
}

interface ComposerProps {
  user: User;
  value: string;
  placeholder: string;
  attachments: DraftAttachment[];
  submitting: boolean;
  compact?: boolean;
  inputRef: RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onPickFiles: (files: FileList | File[] | null) => void;
  onRemoveAttachment: (key: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

const fullTimestamp = (iso: string) => {
  const time = parseCommentTime(iso);
  return Number.isNaN(time) ? '' : new Date(time).toLocaleString();
};

const Composer = ({
  user,
  value,
  placeholder,
  attachments,
  submitting,
  compact = false,
  inputRef,
  onChange,
  onPickFiles,
  onRemoveAttachment,
  onSubmit,
  onCancel,
}: ComposerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const uploading = attachments.some((attachment) => attachment.uploading);
  const ready = attachments.every((attachment) => Boolean(attachment.url));
  const canPost = (value.trim().length > 0 || attachments.length > 0) && !uploading && ready;

  // Grow with the text, then scroll inside a capped box instead of pushing the
  // thread down forever.
  const resize = useCallback(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 144)}px`;
  }, [inputRef]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const submit = () => {
    if (!canPost || submitting) return;
    onSubmit();
  };

  return (
    <form
      className={cn('flex gap-3', compact && 'gap-2.5')}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Avatar className={cn('mt-0.5 shrink-0 ring-1 ring-border/60', compact ? 'h-7 w-7' : 'h-8 w-8')}>
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <textarea
          ref={inputRef}
          rows={1}
          maxLength={2000}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          onPaste={(event) => {
            const pasted = Array.from(event.clipboardData.files);
            if (pasted.length > 0) {
              event.preventDefault();
              onPickFiles(pasted);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            'block max-h-36 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-foreground outline-none',
            'placeholder:text-muted-foreground/80',
            compact ? 'min-h-[1.5rem]' : 'min-h-[1.75rem]',
          )}
        />

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.key}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-border/70 bg-secondary"
              >
                {attachment.type === 'VIDEO' ? (
                  <video
                    src={attachment.previewUrl}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={attachment.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {attachment.uploading && (
                  <span className="absolute inset-0 grid place-items-center bg-black/45">
                    <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                    <span className="sr-only">Uploading attachment</span>
                  </span>
                )}
                {attachment.type === 'GIF' && !attachment.uploading && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold uppercase tracking-wide text-white">
                    GIF
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(attachment.key)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={COMMENT_MEDIA_ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                onPickFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <input
              ref={gifInputRef}
              type="file"
              accept="image/gif"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                onPickFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Attach a photo or short video"
              title="Attach a photo or short video"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => gifInputRef.current?.click()}
              className="rounded-md px-1.5 py-1 text-[11px] font-bold tracking-wide text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Attach a GIF"
              title="Attach a GIF"
            >
              GIF
            </button>
            {attachments.length > 0 && (
              <span className="ml-1 text-[11px] tabular-nums text-muted-foreground">
                {attachments.length}/{MAX_COMMENT_MEDIA}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {value.length > 1800 && (
              <span
                className={cn(
                  'text-[11px] tabular-nums',
                  value.length >= 2000 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {value.length}/2000
              </span>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canPost || submitting}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                canPost && !submitting
                  ? 'text-primary hover:text-primary/80'
                  : 'cursor-default text-muted-foreground/40',
              )}
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              {submitting ? 'Posting' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

const AttachmentGrid = ({
  attachments,
  content,
  onOpen,
}: {
  attachments: CommentAttachment[];
  content: string;
  onOpen: (attachment: CommentAttachment) => void;
}) => {
  if (attachments.length === 0) return null;
  const single = attachments.length === 1;

  return (
    <div className={cn('mt-2 flex flex-wrap gap-2', single && 'max-w-[280px]')}>
      {attachments.map((attachment) => (
        <button
          key={attachment.url}
          type="button"
          onClick={() => onOpen(attachment)}
          className={cn(
            'relative overflow-hidden rounded-xl border border-border/70 bg-secondary/70 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            single ? 'block max-w-full' : 'h-24 w-24 sm:h-28 sm:w-28',
          )}
          aria-label={`Open ${commentMediaLabel(attachment.type).toLowerCase()}`}
        >
          {attachment.type === 'VIDEO' ? (
            <>
              <video
                src={attachment.url}
                muted
                loop
                playsInline
                preload="metadata"
                className={cn('bg-black', single ? 'max-h-72 w-full' : 'h-full w-full object-cover')}
              />
              <span className="absolute inset-0 grid place-items-center bg-black/10">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white">
                  <Play className="ml-0.5 h-4 w-4 fill-current" />
                </span>
              </span>
            </>
          ) : (
            <img
              src={attachment.url}
              alt={content
                ? `Attachment: ${content.slice(0, 80)}`
                : `${commentMediaLabel(attachment.type)} attachment`}
              loading="lazy"
              decoding="async"
              className={cn(single ? 'max-h-72 w-auto max-w-full' : 'h-full w-full object-cover')}
            />
          )}
          {attachment.type === 'GIF' && (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              GIF
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

const CommentRow = ({
  comment,
  root,
  currentUser,
  isJournalOwner,
  isAuthenticated,
  pending,
  deleting,
  removing,
  onReply,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  onOpenMedia,
}: {
  comment: Comment;
  root: Comment;
  currentUser: User | null;
  isJournalOwner: boolean;
  isAuthenticated: boolean;
  pending: boolean;
  deleting: boolean;
  removing: boolean;
  onReply: (root: Comment, mention?: string) => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onOpenMedia: (attachment: CommentAttachment) => void;
}) => {
  const canDelete = Boolean(currentUser) && (currentUser?.id === comment.userId
    || isJournalOwner
    || currentUser?.role === 'ADMIN');
  const name = comment.userName || 'Anonymous';

  return (
    <article
      className={cn('flex gap-3 transition-opacity', (pending || removing) && 'opacity-60')}
      aria-label={`Comment by ${name}`}
    >
      <Link to={`/users/${comment.userId}`} className="shrink-0">
        <Avatar className="h-8 w-8 ring-1 ring-border/60">
          <AvatarImage src={comment.userAvatar} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="text-sm leading-6">
          <Link to={`/users/${comment.userId}`} className="font-semibold text-foreground hover:underline">
            {name}
          </Link>
          {comment.content && (
            <>
              {' '}
              <span className="whitespace-pre-wrap break-words">{comment.content}</span>
            </>
          )}
        </div>

        <AttachmentGrid
          attachments={comment.attachments ?? []}
          content={comment.content}
          onOpen={onOpenMedia}
        />

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={comment.createdAt} title={fullTimestamp(comment.createdAt)}>
            {formatCommentTime(comment.createdAt)}
          </time>

          {pending ? (
            <span className="inline-flex items-center gap-1" role="status">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Posting
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReply(root, comment.id === root.id ? undefined : comment.userName)}
                className="font-semibold transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Reply
              </button>

              {canDelete && (deleting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium text-destructive">Delete?</span>
                  <button
                    type="button"
                    onClick={onConfirmDelete}
                    className="font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={onCancelDelete}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onStartDelete}
                  className="transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ))}

              {isAuthenticated && !isJournalOwner
                && currentUser?.role !== 'ADMIN'
                && currentUser?.id !== comment.userId && (
                <ReportDialog targetType="COMMENT" targetId={comment.id} label="" iconOnly />
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

const CommentThread = ({
  journalId,
  comments,
  currentUser,
  isAuthenticated,
  isJournalOwner,
  onCommentAdded,
  onCommentRemoved,
}: CommentThreadProps) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<DraftAttachment[]>([]);
  const [activeReply, setActiveReply] = useState<Comment | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<DraftAttachment[]>([]);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [pending, setPending] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<CommentAttachment | null>(null);

  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  /**
   * Firefox parks the caret at position 0 when a controlled textarea receives
   * focus after its value was set in code, which would post the reply text
   * before the "@name " mention. Put the caret after the draft instead.
   */
  const focusReplyInput = () => {
    const input = replyInputRef.current;
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  };

  useEffect(() => {
    if (!activeReply) return;
    const frame = window.requestAnimationFrame(() => focusReplyInput());
    return () => window.cancelAnimationFrame(frame);
  }, [activeReply]);

  const trackObjectUrl = (url: string) => {
    objectUrls.current.add(url);
    return url;
  };

  const revokeObjectUrl = (url: string) => {
    if (!url.startsWith('blob:')) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  };

  const allComments = useMemo(() => {
    const serverIds = new Set(comments.map((comment) => comment.id));
    return [...comments, ...pending.filter((comment) => !serverIds.has(comment.id))];
  }, [comments, pending]);

  const { topLevel, repliesByParent } = useMemo(() => {
    const top: Comment[] = [];
    const replies: Record<string, Comment[]> = {};
    for (const comment of allComments) {
      if (!comment.parentId) {
        top.push(comment);
      } else {
        replies[comment.parentId] = [...(replies[comment.parentId] ?? []), comment];
      }
    }
    return { topLevel: top, repliesByParent: replies };
  }, [allComments]);

  const pendingIds = useMemo(() => new Set(pending.map((comment) => comment.id)), [pending]);

  const pickFiles = async (
    files: FileList | File[] | null,
    target: 'top' | 'reply',
  ) => {
    if (!files) return;

    const selected = Array.from(files);
    if (selected.length === 0) return;
    const existing = target === 'top' ? draftAttachments : replyAttachments;
    const setter = target === 'top' ? setDraftAttachments : setReplyAttachments;

    try {
      validateCommentMediaFiles(selected, existing.map((attachment) => attachment.type));
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Those files cannot be attached.',
      });
      return;
    }

    const created: DraftAttachment[] = selected.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      previewUrl: trackObjectUrl(URL.createObjectURL(file)),
      url: null,
      type: commentMediaKind(file),
      uploading: true,
    }));

    setter((previous) => [...previous, ...created]);

    try {
      const urls = await socialApi.uploadCommentMedia(
        selected,
        existing.map((attachment) => attachment.type),
      );
      setter((previous) => previous.map((attachment) => {
        const index = created.findIndex((candidate) => candidate.key === attachment.key);
        return index === -1
          ? attachment
          : { ...attachment, url: urls[index], uploading: false };
      }));
    } catch (error) {
      setter((previous) => previous.filter(
        (attachment) => !created.some((candidate) => candidate.key === attachment.key),
      ));
      created.forEach((attachment) => revokeObjectUrl(attachment.previewUrl));
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Could not upload that media.',
      });
    }
  };

  const removeAttachment = (key: string, target: 'top' | 'reply') => {
    const attachments = target === 'top' ? draftAttachments : replyAttachments;
    const setter = target === 'top' ? setDraftAttachments : setReplyAttachments;
    const removed = attachments.find((attachment) => attachment.key === key);
    if (removed) revokeObjectUrl(removed.previewUrl);
    setter((previous) => previous.filter((attachment) => attachment.key !== key));
  };

  const clearReply = () => {
    replyAttachments.forEach((attachment) => revokeObjectUrl(attachment.previewUrl));
    setReplyAttachments([]);
    setReplyDraft('');
    setActiveReply(null);
  };

  const beginReply = (root: Comment, mention?: string) => {
    if (activeReply?.id !== root.id) {
      replyAttachments.forEach((attachment) => revokeObjectUrl(attachment.previewUrl));
      setReplyAttachments([]);
      setReplyDraft(mention ? `@${mention} ` : '');
    } else if (mention && !replyDraft.trim()) {
      setReplyDraft(`@${mention} `);
      // The composer is already mounted here, so wait for React to commit the
      // new draft before moving the caret behind the mention.
      window.requestAnimationFrame(() => window.requestAnimationFrame(focusReplyInput));
    }
    setActiveReply(root);
  };

  const postComment = async (root: Comment | null) => {
    if (!currentUser) return;

    const reply = Boolean(root);
    const content = (reply ? replyDraft : draft).trim();
    const attachments = reply ? replyAttachments : draftAttachments;
    const key = root?.id ?? 'top';
    if (submittingKey) return;
    if ((!content && attachments.length === 0)
      || attachments.some((attachment) => attachment.uploading || !attachment.url)) {
      return;
    }

    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Comment = {
      id: tempId,
      content,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
      parentId: root?.id ?? null,
      attachments: attachments.map((attachment) => ({
        url: attachment.url as string,
        type: attachment.type,
      })),
    };

    setSubmittingKey(key);
    setPending((previous) => [...previous, optimistic]);
    if (reply && root) {
      setExpanded((previous) => new Set(previous).add(root.id));
    }

    try {
      const created = await socialApi.addComment(
        journalId,
        content,
        root?.id ?? null,
        attachments.map((attachment) => attachment.url as string),
      );
      onCommentAdded(created);
      setPending((previous) => previous.filter((comment) => comment.id !== tempId));

      attachments.forEach((attachment) => revokeObjectUrl(attachment.previewUrl));
      if (reply) {
        setReplyDraft('');
        setReplyAttachments([]);
        setActiveReply(null);
      } else {
        setDraft('');
        setDraftAttachments([]);
      }
      toast({ description: reply ? 'Reply posted.' : 'Comment posted.' });
    } catch (error) {
      setPending((previous) => previous.filter((comment) => comment.id !== tempId));
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Could not post that comment.',
      });
    } finally {
      setSubmittingKey(null);
    }
  };

  const confirmDelete = async (comment: Comment) => {
    setRemovingId(comment.id);
    try {
      await socialApi.deleteComment(journalId, comment.id);
      onCommentRemoved(comment.id);
      setDeletingId(null);
      toast({ description: 'Comment deleted.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Could not delete that comment.',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-14 border-t border-border pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="comments-heading" className="font-display text-xl font-semibold tracking-tight">
          Comments
        </h2>
        <span className="text-sm tabular-nums text-muted-foreground">{allComments.length}</span>
      </div>

      {isAuthenticated && currentUser ? (
        <div className="mt-5">
          <Composer
            user={currentUser}
            value={draft}
            placeholder="Add a comment…"
            attachments={draftAttachments}
            submitting={submittingKey === 'top'}
            inputRef={draftInputRef}
            onChange={setDraft}
            onPickFiles={(files) => pickFiles(files, 'top')}
            onRemoveAttachment={(key) => removeAttachment(key, 'top')}
            onSubmit={() => postComment(null)}
          />
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-4 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-foreground hover:underline">Log in</Link>
            {' '}to join the conversation.
          </p>
        </div>
      )}

      {topLevel.length > 0 ? (
        <div className="mt-8 space-y-7">
          {topLevel.map((root) => {
            const replies = repliesByParent[root.id] ?? [];
            const expandedThread = expanded.has(root.id);
            const visibleReplies = expandedThread ? replies : replies.slice(0, 2);
            const hiddenReplies = replies.length - visibleReplies.length;
            const replying = activeReply?.id === root.id;

            return (
              <div key={root.id}>
                <CommentRow
                  comment={root}
                  root={root}
                  currentUser={currentUser}
                  isJournalOwner={isJournalOwner}
                  isAuthenticated={isAuthenticated}
                  pending={pendingIds.has(root.id)}
                  deleting={deletingId === root.id}
                  removing={removingId === root.id}
                  onReply={beginReply}
                  onStartDelete={() => setDeletingId(root.id)}
                  onCancelDelete={() => setDeletingId(null)}
                  onConfirmDelete={() => confirmDelete(root)}
                  onOpenMedia={setLightbox}
                />

                {replies.length > 0 && (
                  <div className="ml-11 mt-3 space-y-4 border-l border-border/70 pl-4 sm:pl-5">
                    {visibleReplies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        root={root}
                        currentUser={currentUser}
                        isJournalOwner={isJournalOwner}
                        isAuthenticated={isAuthenticated}
                        pending={pendingIds.has(reply.id)}
                        deleting={deletingId === reply.id}
                        removing={removingId === reply.id}
                        onReply={beginReply}
                        onStartDelete={() => setDeletingId(reply.id)}
                        onCancelDelete={() => setDeletingId(null)}
                        onConfirmDelete={() => confirmDelete(reply)}
                        onOpenMedia={setLightbox}
                      />
                    ))}
                    {hiddenReplies > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(root.id)}
                        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span aria-hidden="true" className="h-px w-4 bg-border" />
                        View all {replies.length} replies
                      </button>
                    )}
                    {expandedThread && replies.length > 2 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(root.id)}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Hide replies
                      </button>
                    )}
                  </div>
                )}

                {replying && currentUser && (
                  <div className="ml-11 mt-4">
                    <Composer
                      compact
                      user={currentUser}
                      value={replyDraft}
                      placeholder={`Reply to ${root.userName || 'this comment'}…`}
                      attachments={replyAttachments}
                      submitting={submittingKey === root.id}
                      inputRef={replyInputRef}
                      onChange={setReplyDraft}
                      onPickFiles={(files) => pickFiles(files, 'reply')}
                      onRemoveAttachment={(key) => removeAttachment(key, 'reply')}
                      onSubmit={() => postComment(root)}
                      onCancel={clearReply}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-border">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No comments yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Start the conversation — photos, GIFs and short clips welcome.
          </p>
        </div>
      )}

      <Dialog open={Boolean(lightbox)} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent
          className={cn(
            'w-auto max-w-[92vw] border-0 bg-transparent p-0 shadow-none',
            // The stock X button is 16px and inherits a light colour; give it a
            // dark chip so it stays visible over bright or dark media.
            '[&>button]:right-2 [&>button]:top-2 [&>button]:rounded-full [&>button]:bg-black/60',
            '[&>button]:p-2 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur',
            '[&>button]:hover:bg-black/80 [&>button>svg]:h-5 [&>button>svg]:w-5',
          )}
        >
          <DialogTitle className="sr-only">Comment attachment</DialogTitle>
          {lightbox?.type === 'VIDEO' ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="mx-auto max-h-[85vh] w-auto max-w-full rounded-xl bg-black shadow-2xl ring-1 ring-white/15"
            />
          ) : lightbox ? (
            <img
              src={lightbox.url}
              alt="Comment attachment"
              className="mx-auto max-h-[85vh] w-auto max-w-full rounded-xl bg-black/40 object-contain shadow-2xl ring-1 ring-white/15"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CommentThread;
