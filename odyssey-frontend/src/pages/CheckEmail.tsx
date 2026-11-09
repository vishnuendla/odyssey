import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

interface CheckEmailState {
  email?: string;
  purpose?: 'reset' | 'verify';
  message?: string;
}

const CheckEmail = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state ?? {}) as CheckEmailState;
  const email = state.email ?? searchParams.get('email') ?? undefined;
  const purpose = state.purpose ?? (searchParams.get('purpose') as CheckEmailState['purpose']) ?? 'reset';

  const isVerification = purpose === 'verify';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground">
              {isVerification
                ? 'We sent you a verification link.'
                : 'If an account exists for that address, we sent a password reset link.'}
            </p>
            {email && (
              <p className="font-medium break-all">{email}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {state.message ?? 'The link expires soon, so use it as soon as you can. Check your spam folder if it does not arrive.'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/login">Back to sign in</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/forgot-password">Use a different email</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckEmail;
