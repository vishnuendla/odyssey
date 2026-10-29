
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Settings, MapPin, Mail, Calendar, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { journalApi } from '@/services/api';
import { useEffect, useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  avatar: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  bio: z.string().max(200, { message: 'Bio must be 200 characters or less.' }).optional().or(z.literal('')),
  location: z.string().max(100, { message: 'Location must be 100 characters or less.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [JournalsCount, setDemoJournals] = useState<number>(0);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
          const data = await journalApi.getUserJournals();
          setDemoJournals(data.length);
      } catch (error) {
        console.error('Error fetching journals:', error);
      }
    };

    fetchJournals();
  }, []);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      avatar: user?.avatar || '',
      bio: '',
      location: '',
    },
  });

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        avatar: user.avatar || '',
        bio: user.bio || '',
        location: user.location || '',
      });
      
      if (user.avatar) {
        setPreviewUrl(user.avatar);
      }
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedData = {
        name: data.name,
        avatar: data.avatar || user?.avatar,
        bio: data.bio || user?.bio,
        location: data.location || user?.location,
      };
      const response = await journalApi.updateUserProfile(user?.id,updatedData);
      console.log('Profile update data:', updatedData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviewUrl(url || null);
    form.setValue('avatar', url);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-muted rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Update your personal information</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
              <CardDescription>How others see your profile</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg mb-4">
                <AvatarImage 
                  src={previewUrl || user?.avatar} 
                  alt={user?.name} 
                />
                <AvatarFallback className="text-4xl bg-primary/10">{user?.avatar}</AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold mt-2">{form.watch('name') || user.name}</h2>
              
              {form.watch('location') && (
                <div className="flex items-center mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{form.watch('location')}</span>
                </div>
              )}

              <div className="flex items-center mt-2 text-muted-foreground">
                <Mail className="h-4 w-4 mr-1" />
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center mt-2 text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              {form.watch('bio') && (
                <div className="mt-4 text-sm">
                  <p className="whitespace-pre-wrap">{form.watch('bio')}</p>
                </div>
              )}
              
              <div className="mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 justify-center">
                  {JournalsCount === 0 && <span>No journals created</span>}
                  {JournalsCount === 1 && <span>{JournalsCount} journal created</span>}
                  {JournalsCount > 1 && <span>{JournalsCount} journals created</span>}
                </div>  </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input 
                              placeholder="https://example.com/avatar.jpg" 
                              {...field}
                              value={field.value || ''} 
                              onChange={(e) => {
                                field.onChange(e);
                                handleAvatarChange(e);
                              }}
                            />
                            <div className="flex-shrink-0">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={previewUrl || user.avatar} />
                                <AvatarFallback>
                                  <Camera className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about yourself" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <FormMessage />
                          <div className="text-xs text-muted-foreground">
                            {(field.value?.length || 0)}/200
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City, Country" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => form.reset()}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting || !form.formState.isDirty}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
