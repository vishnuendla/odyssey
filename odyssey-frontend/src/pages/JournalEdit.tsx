import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { journalApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { JournalEntry, Location } from '@/types';

import Navbar from '@/components/layout/Navbar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, MapPin, Plus, X } from 'lucide-react';

const journalSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
  isPublic: z.boolean().default(true),
  location: z.object({
    name: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    country: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).default([]),
});

type JournalFormValues = z.infer<typeof journalSchema>;

const JournalEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: '',
      content: '',
      isPublic: true,
      images: [],
    },
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        description: 'You must be logged in to edit a journal',
      });
      navigate('/login');
      return;
    }

    // Fetch journal data
    const fetchJournal = async () => {
      try {
        if (id) {
          const journalData = await journalApi.getJournalById(id);
          
          // Check if current user owns this journal
          if (journalData.userId !== user?.id) {
            toast({
              variant: "destructive",
              description: 'You do not have permission to edit this journal',
            });
            navigate('/journals');
            return;
          }
          
          // Populate form with journal data
          form.reset({
            title: journalData.title,
            content: journalData.content,
            isPublic: journalData.isPublic,
            location: journalData.location,
            images: journalData.images,
          });
        }
      } catch (error) {
        console.error('Failed to fetch journal:', error);
        toast({
          variant: "destructive",
          description: 'Failed to load journal',
        });
        navigate('/journals');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJournal();
  }, [id, user, isAuthenticated, navigate, toast, form]);

  const onSubmit = async (data: JournalFormValues) => {
    if (!id || !user) return;
    
    setSubmitting(true);
    try {
      const updatedData = {
        ...data,
        location: data.location && data.location.latitude !== undefined && data.location.longitude !== undefined
          ? {
              name: data.location.name || 'Unnamed Location', // Ensure name is defined
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              country: data.location.country,
              city: data.location.city,
            }
          : undefined,
      };
      await journalApi.updateJournal(id, updatedData);
      toast({
        description: 'Journal updated successfully',
      });
      navigate(`/journal/${id}`);
    } catch (error) {
      console.error('Failed to update journal:', error);
      toast({
        variant: "destructive",
        description: 'Failed to update journal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImage = () => {
    const imageUrl = window.prompt('Enter image URL:');
    if (imageUrl) {
      const currentImages = form.getValues('images') || [];
      form.setValue('images', [...currentImages, imageUrl]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    form.setValue('images', currentImages.filter((_, i) => i !== index));
  };

  const handleSetLocation = () => {
    // In a real app, this would open a map selection UI
    // For this example, we'll use a simple prompt
    const locationName = window.prompt('Enter location name:');
    const latitude = parseFloat(window.prompt('Enter latitude:') || '0');
    const longitude = parseFloat(window.prompt('Enter longitude:') || '0');
    const country = window.prompt('Enter country:');
    const city = window.prompt('Enter city:');
    
    if (locationName && !isNaN(latitude) && !isNaN(longitude)) {
      form.setValue('location', {
        name: locationName,
        latitude,
        longitude,
        country: country || undefined,
        city: city || undefined,
      });
    }
  };

  const handleClearLocation = () => {
    form.setValue('location', undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Journal</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Journal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Journal title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write about your experience..." 
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make journal public</FormLabel>
                          <FormDescription>
                            Public journals will be visible to everyone
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {form.watch('images')?.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Journal image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-32 flex flex-col items-center justify-center"
                        onClick={handleAddImage}
                      >
                        <Plus className="h-8 w-8 mb-2" />
                        <span>Add Image</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  {form.watch('location') ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md">
                        <h3 className="font-medium mb-2">
                          {form.watch('location.name') || 'Selected Location'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {form.watch('location.city') && form.watch('location.country')
                            ? `${form.watch('location.city')}, ${form.watch('location.country')}`
                            : `Lat: ${form.watch('location.latitude')}, Lng: ${form.watch('location.longitude')}`}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleClearLocation}
                      >
                        Clear Location
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSetLocation}
                      className="flex items-center"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Set Location
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/journal/${id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Journal'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default JournalEdit;