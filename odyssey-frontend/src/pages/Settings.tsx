import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AccountLayout from '@/components/layout/AccountLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeMode } from '@/types';
import { Check, Moon, Sun, UserRound, Shield, LogOut, Trash2, MailWarning, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/services/api';

const Settings = () => {
  const { user, isLoading, logout, clearSession } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { state: { from: { pathname: '/settings' } } });
    }
  }, [user, isLoading, navigate]);

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  ];

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleteError(null);
    try {
      setIsDeleting(true);
      await authApi.deleteAccount(deletePassword, deleteConfirmation);
      clearSession();
      toast({ description: 'Your account and its data have been deleted.' });
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete your account.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="route-loader" aria-hidden="true" />
      </div>
    );
  }

  return (
    <AccountLayout
      title="Preferences"
      description="Theme, account details, and irreversible actions for your Odyssey account."
    >
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="w-full md:w-fit grid grid-cols-2 md:inline-flex">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize how Odyssey looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Colour mode</span>
                    <span className="settings-row-description">
                      Choose the appearance Odyssey uses in this browser.
                    </span>
                  </div>
                  <div className="settings-row-control" role="group" aria-label="Theme">
                    {themeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={theme === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTheme(option.value)}
                        aria-pressed={theme === option.value}
                        className="gap-2"
                      >
                        {option.icon}
                        <span>{option.label}</span>
                        {theme === option.value && <Check className="h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About appearance settings</CardTitle>
                <CardDescription>
                  Theme is saved in this browser. Other appearance and notification preferences are
                  not available yet, so they are not shown here.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>View and manage your basic account details.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Name</span>
                  </div>
                  <div className="settings-row-control">
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Email</span>
                  </div>
                  <div className="settings-row-control">
                    <span className="break-all text-sm font-medium">{user.email}</span>
                    {user.emailVerified ? (
                      <Badge variant="secondary">Verified</Badge>
                    ) : (
                      <Badge variant="destructive">Unverified</Badge>
                    )}
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Member Since</span>
                  </div>
                  <div className="settings-row-control">
                    <span className="text-sm font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {!user.emailVerified && (
                  <Alert className="mt-4">
                    <MailWarning className="h-4 w-4" />
                    <AlertDescription>
                      Your email is not verified. Publishing and commenting are locked until you confirm
                      the link sent to your inbox. Use the banner at the top of any page to resend it.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row items-start gap-2">
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={() => navigate('/security')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Password &amp; Sessions
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title">Security</span>
                    <span className="settings-row-description">
                      Change your password and review the devices signed in to your account.
                    </span>
                  </div>
                  <div className="settings-row-control">
                    <Button variant="outline" asChild size="sm">
                      <Link to="/security">
                        <Shield className="mr-2 h-4 w-4" />
                        Open security settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title flex items-center gap-2">
                      <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                    </span>
                    <span className="settings-row-description">
                      Sign out from your current session
                    </span>
                  </div>
                  <div className="settings-row-control">
                    <Button variant="outline" size="sm" onClick={() => void logout()}>
                      Logout
                    </Button>
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-row-label">
                    <span className="settings-row-title flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete Account
                    </span>
                    <span className="settings-row-description">
                      Permanently remove your account, journals, comments, and reactions.
                    </span>
                  </div>
                  {!showDelete && (
                    <div className="settings-row-control">
                      <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                        Delete Account
                      </Button>
                    </div>
                  )}
                </div>

                {showDelete && (
                  <form onSubmit={handleDeleteAccount} className="space-y-3 border-t pt-4">
                    {deleteError && (
                      <Alert variant="destructive">
                        <AlertDescription>{deleteError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-password">Confirm your password</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(event) => setDeletePassword(event.target.value)}
                        disabled={isDeleting}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-confirmation">
                        Type <span className="font-mono font-semibold">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="delete-confirmation"
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        placeholder="DELETE"
                        disabled={isDeleting}
                        required
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="submit" variant="destructive" disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                          </>
                        ) : (
                          'Permanently delete account'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                        onClick={() => {
                          setShowDelete(false);
                          setDeletePassword('');
                          setDeleteConfirmation('');
                          setDeleteError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </AccountLayout>
  );
};

export default Settings;
