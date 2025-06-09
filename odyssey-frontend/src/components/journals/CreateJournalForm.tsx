
import React, { useState } from 'react';
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
import { MapPin, X, ImagePlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Location } from '@/types';
import { journalApi } from '@/services/api';

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  content: z.string().min(10, { message: 'Content must be at least 10 characters' }),
  isPublic: z.boolean().default(true),
  location: z.object({
    name: z.string().min(1, { message: 'Location name is required' }),
    latitude: z.number(),
    longitude: z.number(),
    country: z.string().optional().nullable().default(null),
    city: z.string().optional().nullable().default(null),
  }).optional(),  
  images: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateJournalForm() {
  const { createJournal } = useJournal();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
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

  const handleLocationSearch = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }
    
    setLocationQuery(query);
    setIsSearchingLocation(true);
    try {
      // Use the API service instead of the mock function
      const suggestions = await journalApi.searchLocations(query);
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error searching for locations:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const fetchLocationDetails = async (lat: string, lon: string) => {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    return {
      country: data.address.country,
      city: data.address.city || data.address.town || data.address.village,
    };
  };
  

  const handleLocationSelect = async (loc: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.name);
  
    let city = '', country = '';
  
    try {
      const details = await fetchLocationDetails(
        loc.latitude.toString(),
        loc.longitude.toString()
      );
      city = details.city;
      country = details.country;
    } catch (error) {
      console.warn("Reverse geocoding failed", error);
    }
  
    const fullLoc: Location = {
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      city,
      country,
    };
  
    form.setValue('location', fullLoc);
    setLocationSuggestions([]);
  };
  

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Store files for later upload during form submission
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Create temporary preview URLs
    const newImages: string[] = [];
    newFiles.forEach(file => {
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
    });
    
    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    form.setValue('images', updatedImages);
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = uploadedImages.filter((_, index) => index !== indexToRemove);
    const updatedFiles = uploadedFiles.filter((_, index) => index !== indexToRemove);
    setUploadedImages(updatedImages);
    setUploadedFiles(updatedFiles);
    form.setValue('images', updatedImages);
  };

  async function onSubmit(data: FormData) {
    console.log("Form submission data:", data);
    try {
      setIsSubmitting(true);
      
      // Upload images first
      let imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        imageUrls = await journalApi.uploadImages(uploadedFiles);
      }
      
      const journalLocation: Location = selectedLocation || {
        name: 'Unknown location',
        latitude: 0,
        longitude: 0,
      };
      
      await createJournal({
        title: data.title,
        content: data.content,
        isPublic: data.isPublic,
        location: journalLocation,
        images: imageUrls, 
      });
      
      navigate('/journals');
    } catch (error) {
      console.error('Failed to create journal', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Amazing Adventure"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Give your journal entry a memorable title
              </FormDescription>
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
                  placeholder="Tell your story..."
                  className="min-h-[200px]"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Write about your experience, thoughts, and memories
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem className="space-y-3">
  <FormLabel>Location</FormLabel>
  <div className="grid gap-3 relative">
    {/* Input Box */}
    <div className="relative">
      <Input
        type="text"
        placeholder="Search for a location..."
        value={locationQuery}
        onChange={e => handleLocationSearch(e.target.value)}
        className="pr-10"
        disabled={isSubmitting || !!selectedLocation}
      />
      {isSearchingLocation && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Icons.spinner className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>

    {/* Suggestions Dropdown */}
    {locationQuery && !selectedLocation && (
      <Card className="absolute z-50 top-[100%] left-0 w-full mt-1 max-h-[200px] overflow-auto shadow-lg border rounded-md bg-background">
        <ul className="space-y-1">
          {locationSuggestions.map((loc, index) => (
            <li
              key={index}
              className="p-2 hover:bg-accent rounded-md cursor-pointer flex items-center"
              onClick={() => handleLocationSelect(loc)}
            >
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span>{loc.name}</span>
            </li>
          ))}

          {/* Fallback option */}
          {locationSuggestions.length === 0 && !isSearchingLocation && (
            <li
              className="p-2 text-muted-foreground hover:bg-accent rounded-md cursor-pointer"
              onClick={() =>
                handleLocationSelect({
                  name: locationQuery,
                  latitude: 0,
                  longitude: 0,
                })
              }
            >
              Use "<strong>{locationQuery}</strong>" as location
            </li>
          )}
        </ul>
      </Card>
    )}

    {/* Selected Location Display */}
    {selectedLocation && (
      <div className="flex items-center justify-between p-3 border rounded-md bg-accent/50">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          <span>{selectedLocation.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedLocation(null);
            form.setValue('location', undefined);
            setLocationQuery('');
          }}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
  <FormDescription>
    Tag the location of your travel experience
  </FormDescription>
</FormItem>


        <FormItem className="space-y-3">
          <FormLabel>Images</FormLabel>
          <div className="space-y-4">
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary transition-colors">
                  <ImagePlus className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload images</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 10MB</p>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isSubmitting}
                />
              </label>
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square rounded-md overflow-hidden">
                    <img src={image} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover" />
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
              </div>
            )}
          </div>
          <FormDescription>
            Add photos from your travel experience
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
                  Make your journal visible to everyone
                </FormDescription>
              </div>
              <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(val) => form.setValue("isPublic", val)}
                disabled={isSubmitting}
              />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Journal'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
