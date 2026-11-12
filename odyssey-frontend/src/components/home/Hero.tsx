
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Camera, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="py-12 md:py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=3131&auto=format&fit=crop')] bg-cover bg-center opacity-15 z-0"></div>
      <div className="container relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Document Your Journey, <span className="text-primary">Share Your Adventures</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Create beautiful travel journals with interactive maps, rich media galleries, and immersive storytelling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? "/create" : "/register"}>
                  {isAuthenticated ? "Start Journaling" : "Create an Account"}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/explore">Explore Journals</Link>
              </Button>
            </div>
            
            <div className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Location Tagging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Rich Text Editor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Photo Galleries</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Interactive Maps</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?q=70&w=900&auto=format&fit=crop"
              alt="Travel journal entry"
              width={900}
              height={600}
              loading="eager"
              decoding="async"
              className="col-span-2 h-56 w-full rounded-xl object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=70&w=600&auto=format&fit=crop"
              alt="Travel experience"
              width={600}
              height={450}
              loading="lazy"
              decoding="async"
              className="h-44 w-full rounded-xl object-cover shadow-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=70&w=600&auto=format&fit=crop"
              alt="Map view"
              width={600}
              height={450}
              loading="lazy"
              decoding="async"
              className="h-44 w-full rounded-xl object-cover shadow-lg"
            />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
