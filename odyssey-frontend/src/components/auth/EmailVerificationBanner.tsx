import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { authApi } from '@/services/api';
import { MailWarning, CheckCircle2, Loader2 } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !user || user.emailVerified !== false) {
    return null;
  }

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
    <div className="border-b bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <div className="flex items-start sm:items-center gap-2">
          {sent ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0 text-green-600 dark:text-green-400" />
          ) : (
            <MailWarning className="h-4 w-4 mt-0.5 sm:mt-0 flex-shrink-0" />
          )}
          <span>
            {sent
              ? `Verification email sent to ${user.email}. Check your inbox.`
              : error ?? `Verify ${user.email} to publish journals and comment.`}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-amber-900/30 bg-transparent hover:bg-amber-900/10"
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
          <Button asChild size="sm" variant="ghost" className="h-8 hover:bg-amber-900/10">
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
