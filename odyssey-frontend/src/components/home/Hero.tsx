
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
          
          <div className="hidden lg:block relative">
            <div className="absolute left-16 top-0 w-80 h-64 bg-ocean-400 rounded-lg shadow-xl transform -rotate-6 z-10">
              <img src="https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?q=80&w=2960&auto=format&fit=crop" alt="Travel journal entry" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="absolute left-48 top-24 w-80 h-64 bg-sunset-400 rounded-lg shadow-xl transform rotate-3 z-20">
              <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=3130&auto=format&fit=crop" alt="Travel experience" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="absolute left-28 top-48 w-80 h-64 bg-earth-400 rounded-lg shadow-xl transform -rotate-3 z-30">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" alt="Map view" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
