import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? 'Verifying your email address...' : 'This verification link is missing its token.'
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) {
      return;
    }
    attempted.current = true;

    authApi.verifyEmail(token)
      .then(async (successMessage) => {
        setStatus('success');
        setMessage(successMessage);
        if (isAuthenticated) {
          try {
            await refreshUser();
          } catch {
            // The user can refresh the page if the session was not active.
          }
        }
      })
      .catch((error: unknown) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'This verification link is invalid or has expired.');
      });
  }, [token, isAuthenticated, refreshUser]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            {status === 'loading' && <Loader2 className="h-7 w-7 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-7 w-7 text-green-600" />}
            {status === 'error' && <XCircle className="h-7 w-7 text-destructive" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {status === 'loading' && 'Verifying your email'}
              {status === 'success' && 'Email verified'}
              {status === 'error' && 'Verification problem'}
            </h1>
            {status === 'error' ? (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-muted-foreground">{message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {status === 'success' && (
              <Button asChild>
                <Link to={isAuthenticated ? '/journals' : '/login'}>
                  {isAuthenticated ? 'Continue to your journals' : 'Sign in'}
                </Link>
              </Button>
            )}
            {status === 'error' && (
              <>
                <Button asChild>
                  <Link to={isAuthenticated ? '/settings' : '/login'}>
                    {isAuthenticated ? 'Resend from settings' : 'Sign in'}
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/">Go home</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
