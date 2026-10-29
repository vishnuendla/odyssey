import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { journalApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { JournalEntry, Location } from '@/types';
import { getCoordinatesFromPlaceName, getLocationSuggestions, debounce } from '@/utils/geocoding';

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
import { Loader2, MapPin, Plus, X, ImagePlus } from 'lucide-react';
import { Icons } from '@/components/shared/Icons';

const journalSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
  isPublic: z.boolean().default(true),
  location: z.any().optional(),
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
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

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
          
          // Set existing images
          setExistingImages(journalData.images || []);
          
          // Populate form fields individually to preserve dirty state
          form.setValue('title', journalData.title);
          form.setValue('content', journalData.content);
          form.setValue('isPublic', journalData.isPublic);
          form.setValue('location', journalData.location);
          form.setValue('images', journalData.images || []);
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

  const handleLocationSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      setLocationQuery(query);
      setIsSearchingLocation(true);
      
      try {
        // Use the proper autocomplete function
        const suggestions = await getLocationSuggestions(query);
        if (suggestions && suggestions.length > 0) {
          // Convert suggestions to the Location interface format
          const locations: Location[] = suggestions.map(suggestion => ({
            name: suggestion.name,
            latitude: suggestion.latitude,
            longitude: suggestion.longitude,
            placeName: suggestion.placeName,
            country: suggestion.country,
            city: suggestion.city
          }));
          setLocationSuggestions(locations);
        } else {
          // If no suggestions found, clear the list
          setLocationSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching for locations:', error);
        setLocationSuggestions([]);
        toast({
          variant: "destructive",
          description: 'Location search temporarily unavailable. Please try again.',
        });
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500),
    [toast]
  );

  const handleLocationSelect = (loc: Location) => {
    form.setValue('location', loc);
    setLocationQuery(loc.name);
    setLocationSuggestions([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    const newImages: string[] = [];
    newFiles.forEach(file => {
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
    });
    
    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    form.setValue('images', [...existingImages, ...updatedImages]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    setUploadedFiles(updatedFiles);
    form.setValue('images', [...existingImages, ...updatedImages]);
  };

  const onSubmit = async (data: JournalFormValues) => {
    console.log('onSubmit called with:', data);
    if (!id || !user) return;
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        imageUrls = await journalApi.uploadImages(uploadedFiles);
      }

      const updatedData = {
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        location: data.location && data.location.name
          ? {
              name: data.location.name || 'Unnamed Location',
              latitude: data.location.latitude || 0,
              longitude: data.location.longitude || 0,
              country: data.location.country,
              city: data.location.city,
            }
          : undefined,
        images: [...existingImages, ...imageUrls],
      };
      console.log('Sending updatedData:', updatedData);
      await journalApi.updateJournal(id, updatedData);
      toast({
        description: 'Journal updated successfully',
      });
      navigate(`/journals/${id}`);
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
                          <Input 
                            placeholder="Journal title" 
                            {...field}
                            onChange={(e) => {
                              console.log('Title changed to:', e.target.value);
                              field.onChange(e);
                            }}
                          />
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
                            onChange={(e) => {
                              console.log('Content changed to:', e.target.value);
                              field.onChange(e);
                            }}
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
                            onCheckedChange={(checked) => {
                              console.log('isPublic changed to:', checked);
                              field.onChange(checked);
                            }}
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
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="relative">
                      <Input
                        placeholder="Enter a location..."
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          handleLocationSearch(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Allow manual entry by pressing Enter
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (locationQuery.trim()) {
                              const manualLocation = {
                                name: locationQuery,
                                latitude: 0,
                                longitude: 0,
                                placeName: locationQuery
                              };
                              handleLocationSelect(manualLocation);
                            }
                          }
                        }}
                        disabled={submitting}
                      />
                      {(isSearchingLocation || isGeocoding) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {locationSuggestions.length > 0 && (
                      <div className="relative">
                        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                          {locationSuggestions.map((loc, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-accent"
                              onClick={() => handleLocationSelect(loc)}
                            >
                              {loc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {form.watch('location') && (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{form.watch('location.name')}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue('location', undefined);
                            setLocationQuery('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Display existing images */}
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square group">
                        <img
                          src={image}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const updatedExistingImages = existingImages.filter((_, i) => i !== index);
                            setExistingImages(updatedExistingImages);
                            form.setValue('images', [...updatedExistingImages, ...uploadedImages]);
                          }}
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Display newly uploaded images */}
                    {uploadedImages.map((image, index) => (
                      <div key={`new-${index}`} className="relative aspect-square group">
                        <img
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <label className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={submitting}
                      />
                      <div className="text-center p-4">
                        <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Add Images</span>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/journals/${id}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    console.log('Form errors:', form.formState.errors);
                    console.log('Form values:', form.getValues());
                    console.log('Form dirty fields:', form.formState.dirtyFields);
                    console.log('Form is valid:', form.formState.isValid);
                  }}
                >
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