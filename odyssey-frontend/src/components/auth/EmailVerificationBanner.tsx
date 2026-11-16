import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/api';
import { MailWarning, CheckCircle2, Loader2, X } from 'lucide-react';

const DISMISS_KEY = 'odyssey-verify-banner-dismissed';

/**
 * CodeQL flags storing account identifiers in localStorage as clear text,
 * so the per-user dismissal key is stored as an FNV-1a digest instead.
 */
const hashUserId = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const EmailVerificationBanner = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setDismissed(false);
      return;
    }
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      setDismissed(stored === hashUserId(user.id));
    } catch {
      setDismissed(false);
    }
  }, [user?.id]);

  if (!isAuthenticated || !user || user.emailVerified !== false || dismissed) {
    return null;
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, hashUserId(user.id));
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const resend = async () => {
    setError(null);
    try {
      setIsSending(true);
      await authApi.resendVerification();
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not resend the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-b border-border/60 bg-primary/5 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          {sent ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 text-green-600 dark:text-green-400" />
          ) : (
            <MailWarning className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 text-primary" />
          )}
          <span className="min-w-0">
            {sent
              ? `Verification email sent to ${user.email}. Check your inbox.`
              : error ?? `Verify ${user.email} to publish journals and comment.`}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-transparent"
            onClick={resend}
            disabled={isSending || sent}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending...
              </>
            ) : sent ? (
              'Sent'
            ) : (
              'Resend email'
            )}
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-7">
            <Link to="/settings">Settings</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => void refreshUser().catch(() => undefined)}
            aria-label="Refresh verification status"
            title="Refresh verification status"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={dismiss}
            aria-label="Dismiss verification reminder"
            title="Dismiss until next sign-in"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
