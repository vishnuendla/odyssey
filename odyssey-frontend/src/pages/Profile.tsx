
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Settings, MapPin, Mail, Calendar, Check, X, BookOpen, Globe, Camera as CameraIcon, FileText, Route, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authApi, journalApi, statsApi } from '@/services/api';
import type { UserStats } from '@/types';
import { useEffect, useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  avatar: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  bio: z.string().max(200, { message: 'Bio must be 200 characters or less.' }).optional().or(z.literal('')),
  location: z.string().max(100, { message: 'Location must be 100 characters or less.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, isLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [JournalsCount, setDemoJournals] = useState<number>(0);
  const [stats, setStats] = useState<UserStats | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    statsApi
      .my()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch((error) => console.error('Error fetching stats:', error));
    return () => {
      cancelled = true;
    };
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
      const response = await authApi.updateProfile({
        name: data.name,
        avatar: data.avatar || '',
        bio: data.bio || '',
        location: data.location || '',
      });
      updateUser(response);
      form.reset({
        name: response.name,
        avatar: response.avatar || '',
        bio: response.bio || '',
        location: response.location || '',
      });
      setPreviewUrl(response.avatar || null);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="route-loader" aria-hidden="true" />
      </div>
    );
  }

  const watchedName = form.watch('name') || user.name;
  const watchedLocation = form.watch('location');
  const watchedBio = form.watch('bio');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="page-head">
          <div className="page-head-body">
            <span className="eyebrow">Account</span>
            <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">Update your personal information</p>
          </div>
          <div className="page-head-actions">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Go to Settings
            </Button>
          </div>
        </div>

        <section
          aria-label="Profile header"
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
          <div className="h-24 w-full bg-secondary sm:h-32" />
          <div className="px-4 pb-5 sm:px-6">
            <Avatar className="-mt-10 h-20 w-20 border-4 border-background shadow-md sm:-mt-12 sm:h-24 sm:w-24">
              <AvatarImage
                src={previewUrl || user.avatar}
                alt={user.name}
              />
              <AvatarFallback className="bg-primary/10 text-3xl">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="mt-3">
              <h2 className="text-2xl font-semibold tracking-tight">{watchedName}</h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {watchedLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {watchedLocation}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>

              {watchedBio && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {watchedBio}
                </p>
              )}

              <p className="mt-3 text-sm text-muted-foreground">
                {JournalsCount === 0 && <span>No journals created</span>}
                {JournalsCount === 1 && <span>{JournalsCount} journal created</span>}
                {JournalsCount > 1 && <span>{JournalsCount} journals created</span>}
              </p>
            </div>
          </div>
        </section>

        {stats && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight">Travel stats</h2>
              <p className="text-sm text-muted-foreground">
                Everything you have written, mapped and photographed
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { icon: BookOpen, label: 'Journals', value: stats.journals.toLocaleString() },
                { icon: Globe, label: 'Countries', value: stats.countries.toLocaleString() },
                { icon: MapPin, label: 'Cities', value: stats.cities.toLocaleString() },
                { icon: CameraIcon, label: 'Photos', value: stats.photos.toLocaleString() },
                { icon: FileText, label: 'Words', value: stats.words.toLocaleString() },
                { icon: Route, label: 'Km travelled', value: stats.kilometres.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="stat-tile">
                  <span className="stat-tile-value">{value}</span>
                  <span className="stat-tile-label flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {stats.topTags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {stats.topTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag} · {count}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Edit Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update your personal details and profile picture
            </p>
          </div>
          <Card>
            <CardContent className="p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>

                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="https://example.com/avatar.jpg"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                handleAvatarChange(e);
                              }}
                            />
                            <div className="shrink-0">
                              <Avatar className="h-10 w-10">
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

                  <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset({
                          name: user.name,
                          avatar: user.avatar || '',
                          bio: user.bio || '',
                          location: user.location || '',
                        });
                        setPreviewUrl(user.avatar || null);
                      }}
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
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
