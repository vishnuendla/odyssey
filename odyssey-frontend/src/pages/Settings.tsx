import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mb-2"></div>
          <div className="h-4 w-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate('/profile')}
          >
            <UserRound className="mr-2 h-4 w-4" />
            View Profile
          </Button>
        </div>

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
              <CardContent>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {themeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? 'default' : 'outline'}
                      className={`p-4 flex flex-col items-center justify-center h-auto gap-2 transition-all ${
                        theme === option.value ? 'border-2 border-primary' : ''
                      }`}
                      onClick={() => setTheme(option.value)}
                    >
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                        {option.icon}
                      </div>
                      <span>{option.label}</span>
                      {theme === option.value && <Check className="h-4 w-4 text-primary" />}
                    </Button>
                  ))}
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
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <div className="font-medium">{user.name}</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <div className="font-medium break-all flex items-center gap-2">
                      {user.email}
                      {user.emailVerified ? (
                        <Badge variant="secondary">Verified</Badge>
                      ) : (
                        <Badge variant="destructive">Unverified</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-muted-foreground">Member Since</Label>
                    <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                {!user.emailVerified && (
                  <Alert>
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
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Change your password and review the devices signed in to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/security">
                    <Shield className="mr-2 h-4 w-4" />
                    Open security settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold flex items-center">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sign out from your current session
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => void logout()}>
                      Logout
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-destructive/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-destructive flex items-center">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently remove your account, journals, comments, and reactions.
                      </p>
                    </div>
                    {!showDelete && (
                      <Button variant="destructive" onClick={() => setShowDelete(true)}>
                        Delete Account
                      </Button>
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
                          Type <span className="font-mono font-bold">DELETE</span> to confirm
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
