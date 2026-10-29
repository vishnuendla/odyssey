
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeMode } from '@/types';
import { Check, Globe, Moon, Sun, UserRound, Bell, Shield, LogOut, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  ];

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, you would call an API to delete the account
      console.log('Delete account');
      logout();
      navigate('/');
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    // In a real app, you would call an API to update the setting
    console.log(`Setting changed: ${setting} = ${value}`);
    toast({
      description: `${setting} setting updated`,
    });
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
          <TabsList className="w-full md:w-fit grid grid-cols-3 md:inline-flex">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize how Odyssey looks on your device.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? "default" : "outline"}
                      className={`p-4 flex flex-col items-center justify-center h-auto gap-2 transition-all ${
                        theme === option.value ? "border-2 border-primary" : ""
                      }`}
                      onClick={() => setTheme(option.value)}
                    >
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                        {option.icon}
                      </div>
                      <span>{option.label}</span>
                      {theme === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interface</CardTitle>
                <CardDescription>Customize how elements are displayed.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <Label htmlFor="animations" className="font-medium">Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable animations throughout the interface</p>
                    </div>
                    <Switch 
                      id="animations"
                      defaultChecked 
                      onCheckedChange={(checked) => handleSettingChange('Animations', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Use less space in the interface</p>
                    </div>
                    <Switch 
                      id="compact-mode"
                      onCheckedChange={(checked) => handleSettingChange('Compact Mode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how and when you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive updates via email</p>
                      </div>
                    </div>
                    <Switch 
                      id="email-notifications"
                      defaultChecked 
                      onCheckedChange={(checked) => handleSettingChange('Email Notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="comment-notifications" className="font-medium">Comment Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get notified when someone comments on your journals</p>
                      </div>
                    </div>
                    <Switch 
                      id="comment-notifications"
                      defaultChecked 
                      onCheckedChange={(checked) => handleSettingChange('Comment Notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-start gap-3">
                      <Bell className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="reaction-notifications" className="font-medium">Reaction Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get notified when someone reacts to your journals</p>
                      </div>
                    </div>
                    <Switch 
                      id="reaction-notifications" 
                      defaultChecked
                      onCheckedChange={(checked) => handleSettingChange('Reaction Notifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
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
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm text-muted-foreground">Member Since</Label>
                    <div className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/profile')}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Manage your privacy preferences.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="public-profile" className="font-medium">Public Profile</Label>
                        <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
                      </div>
                    </div>
                    <Switch 
                      id="public-profile" 
                      defaultChecked
                      onCheckedChange={(checked) => handleSettingChange('Public Profile', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label htmlFor="default-journal-visibility" className="font-medium">Default Journal Visibility</Label>
                        <p className="text-sm text-muted-foreground">Make new journals public by default</p>
                      </div>
                    </div>
                    <Switch 
                      id="default-journal-visibility"
                      onCheckedChange={(checked) => handleSettingChange('Default Journal Visibility', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-destructive/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-destructive flex items-center">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sign out from your current session
                      </p>
                    </div>
                    <Button variant="outline" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-destructive p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-destructive flex items-center">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently remove your account and all data
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
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
