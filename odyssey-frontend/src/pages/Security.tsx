import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ApiError, SessionInfo, authApi } from '@/services/api';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Loader2,
  LogOut,
  Monitor,
  ShieldAlert,
} from 'lucide-react';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Enter your current password' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(72, { message: 'Password must be 72 characters or less' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

function describeDevice(userAgent?: string): string {
  if (!userAgent) {
    return 'Unknown device';
  }
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Browser';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad|iPod/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'an unknown OS';
  return `${browser} on ${os}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

const Security = () => {
  const { user, isLoading, updateUser, logoutAll } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  });

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      setSessions(await authApi.getSessions());
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Could not load your sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { state: { from: { pathname: '/security' } } });
      return;
    }
    if (user) {
      void loadSessions();
    }
  }, [user, isLoading, navigate, loadSessions]);

  const onChangePassword = async (data: PasswordForm) => {
    setFormError(null);
    try {
      setIsSaving(true);
      const updated = await authApi.changePassword(data.currentPassword, data.password);
      updateUser(updated);
      form.reset();
      toast({ title: 'Password updated', description: 'Other devices have been signed out.' });
      void loadSessions();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors.currentPassword) {
          form.setError('currentPassword', { message: error.fieldErrors.currentPassword });
        }
        if (error.fieldErrors.newPassword) {
          form.setError('password', { message: error.fieldErrors.newPassword });
        }
        setFormError(error.message);
      } else {
        setFormError('Could not update your password. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (session: SessionInfo) => {
    try {
      await authApi.revokeSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      toast({ description: 'Session signed out.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Could not sign out that session.',
      });
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Sign out of Odyssey on every device, including this one?')) {
      return;
    }
    try {
      await logoutAll();
      navigate('/login', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Could not sign out all sessions.',
      });
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">Manage your password and active sign-ins.</p>
        </div>

        {!user.emailVerified && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Your email address is not verified yet. Publishing and commenting stay locked until you
              confirm it. Use the banner at the top of the page to resend the link.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Change password
            </CardTitle>
            <CardDescription>
              Changing your password signs out every other device. This device stays signed in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onChangePassword)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            className="pr-10"
                            {...field}
                            disabled={isSaving}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" /> Active sessions
            </CardTitle>
            <CardDescription>
              Devices currently signed in with a valid refresh token.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading sessions...
              </div>
            )}

            {sessionsError && (
              <Alert variant="destructive">
                <AlertDescription>{sessionsError}</AlertDescription>
              </Alert>
            )}

            {!sessionsLoading && !sessionsError && sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No active sessions were found.</p>
            )}

            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe2 className="h-4 w-4 text-muted-foreground" />
                    {describeDevice(session.userAgent)}
                    {session.current && <Badge variant="secondary">This device</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Signed in {formatDate(session.createdAt)}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last used {formatDate(session.lastUsedAt)} · Expires {formatDate(session.expiresAt)}
                  </p>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm" onClick={() => handleRevoke(session)}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleLogoutAll}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out everywhere
            </Button>
          </CardFooter>
        </Card>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Sessions use rotating, single-use refresh tokens stored in HttpOnly cookies.
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Security;
