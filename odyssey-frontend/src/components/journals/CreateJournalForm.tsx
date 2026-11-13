import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useJournal } from '@/contexts/JournalContext';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/shared/Icons';
import { MapPin, X, ImagePlus, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Location } from '@/types';
import { journalApi, MAX_FILES_PER_UPLOAD, MAX_FILE_SIZE } from '@/services/api';
import { getLocationSuggestions, debounce } from '@/utils/geocoding';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  isPublic: z.boolean().default(true),
  location: z.object({
    name: z.string().min(1, { message: 'Location name is required' }),
    latitude: z.number(),
    longitude: z.number(),
    placeName: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
  }).optional(),  
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const MIN_SEARCH_LENGTH = 3; // Minimum characters before searching
const MAX_TAGS = 8;

const CreateJournalForm = () => {
  const { createJournal } = useJournal();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const uploadedImagesRef = useRef<string[]>([]);

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (!value) return;
    if (tags.includes(value)) {
      setTagInput('');
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast({
        variant: 'destructive',
        description: `You can add up to ${MAX_TAGS} tags.`,
      });
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput('');
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      isPublic: false,
      images: [],
    },
    shouldUnregister: true,
  });
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  // Autocomplete responses can arrive out of order; only the newest query wins.
  const locationRequestId = useRef(0);

  const handleLocationSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < MIN_SEARCH_LENGTH) {
        locationRequestId.current += 1;
        setLocationSuggestions([]);
        return;
      }

      const requestId = ++locationRequestId.current;
      setLocationQuery(query);
      setIsSearchingLocation(true);

      try {
        const suggestions = await getLocationSuggestions(query);
        if (requestId !== locationRequestId.current) {
          return;
        }
        setLocationSuggestions(suggestions.map((suggestion) => ({
          name: suggestion.name,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          placeName: suggestion.placeName,
          country: suggestion.country,
          city: suggestion.city,
        })));
      } catch (error) {
        if (requestId !== locationRequestId.current) {
          return;
        }
        console.error('Error searching for locations:', error);
        setLocationSuggestions([]);
        toast({
          variant: "destructive",
          description: 'Failed to get location coordinates. Please try again.',
        });
      } finally {
        if (requestId === locationRequestId.current) {
          setIsSearchingLocation(false);
        }
      }
    }, 500),
    [toast]
  );

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.name);
    form.setValue('location', loc);
    setLocationSuggestions([]);
  };

  const handleBack = () => {
    // Clear location state when going back
    setLocationQuery('');
    setSelectedLocation(null);
    setLocationSuggestions([]);
    form.setValue('location', undefined);
    navigate(-1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const slotsLeft = MAX_FILES_PER_UPLOAD - uploadedFiles.length;
    if (slotsLeft <= 0) {
      toast({
        variant: 'destructive',
        description: `A journal can have at most ${MAX_FILES_PER_UPLOAD} images.`,
      });
      return;
    }
    if (newFiles.length > slotsLeft) {
      toast({
        variant: 'destructive',
        description: `You can add ${slotsLeft} more image${slotsLeft === 1 ? '' : 's'}.`,
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const tooLarge = newFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (tooLarge) {
      toast({ variant: 'destructive', description: `${tooLarge.name} is larger than 5 MB.` });
      return;
    }
    const badType = newFiles.find((file) => !allowedTypes.includes(file.type));
    if (badType) {
      toast({
        variant: 'destructive',
        description: 'Only JPEG, PNG, GIF and WebP images are allowed.',
      });
      return;
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    const newImages = newFiles.map((file) => URL.createObjectURL(file));
    setUploadedImages((prev) => [...prev, ...newImages]);
    form.setValue('images', [...uploadedImages, ...newImages]);
  };

  const removeImage = (indexToRemove: number) => {
    const removed = uploadedImages[indexToRemove];
    if (removed) {
      URL.revokeObjectURL(removed);
    }
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    setUploadedFiles(updatedFiles);
    form.setValue('images', updatedImages);
  };

  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true);
      
      let imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        imageUrls = await journalApi.uploadImages(uploadedFiles);
      }
      
      // A journal can have no location. Only send one when the user picked a
      // place; otherwise the backend would store a bogus 0,0 coordinate.
      const journalLocation: Location | undefined = selectedLocation || undefined;
      
      await createJournal({
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        location: journalLocation,
        images: imageUrls,
        tags,
      });
      
      navigate('/journals');
    } catch (error) {
      console.error('Failed to create journal', error);
      toast({
        variant: "destructive",
        description: 'Failed to create journal',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter journal title" {...field} />
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
                      placeholder="Write your journal entry..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag and press Enter"
                  maxLength={30}
                  disabled={isSubmitting || tags.length >= MAX_TAGS}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={isSubmitting || !tagInput.trim() || tags.length >= MAX_TAGS}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((value) => value !== tag))}
                        className="rounded-full hover:bg-primary/20"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <FormDescription>
                Add up to {MAX_TAGS} tags so other travelers can discover your journal.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public Journal</FormLabel>
                    <FormDescription>
                      Make this journal visible to other users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={() => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="grid gap-3 relative">
                    <div className="relative">
                      <Input
                        placeholder="Enter a location..."
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          handleLocationSearch(e.target.value);
                        }}
                        disabled={isSubmitting || !!selectedLocation}
                      />
                      {(isSearchingLocation) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {locationQuery && !selectedLocation && locationQuery.length >= MIN_SEARCH_LENGTH && (
                      <Card className="absolute z-50 top-[100%] left-0 w-full mt-1 max-h-[200px] overflow-auto shadow-lg border rounded-md bg-background">
                        <CardContent className="p-2">
                          {locationSuggestions.length > 0 ? (
                            <ul className="space-y-1">
                              {locationSuggestions.map((loc, index) => (
                                <li
                                  key={index}
                                  className="p-2 hover:bg-accent rounded-md cursor-pointer"
                                  onClick={() => handleLocationSelect(loc)}
                                >
                                  {loc.name}
                                </li>
                              ))}
                            </ul>
                          ) : isSearchingLocation ? (
                            <div className="p-2 text-muted-foreground">
                              Searching...
                            </div>
                          ) : (
                            <div className="p-2 text-muted-foreground">
                              No locations found
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {selectedLocation && (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedLocation.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(null);
                            setLocationQuery('');
                            form.setValue('location', undefined);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem className="space-y-3">
              <FormLabel>Images</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {uploadedFiles.length < MAX_FILES_PER_UPLOAD && (
                  <label className="aspect-square border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                    />
                    <div className="text-center p-4">
                      <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Add Images</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {MAX_FILES_PER_UPLOAD - uploadedFiles.length} left
                      </span>
                    </div>
                  </label>
                )}
              </div>
              <FormDescription>
                Upload images from your travel experience
              </FormDescription>
            </FormItem>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Creating Journal...
                </>
              ) : (
                'Create Journal'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateJournalForm;
