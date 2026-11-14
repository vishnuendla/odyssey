
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Camera, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="py-12 md:py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=70&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-15 z-0"></div>
      <div className="container relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
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
            <div className="col-span-2 overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:rotate-0 group">
              <img
                src="https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?q=70&w=900&auto=format&fit=crop"
                alt="Travel journal entry"
                width={900}
                height={600}
                loading="eager"
                decoding="async"
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:rotate-0 hover:-translate-y-1 group -rotate-2">
              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=70&w=600&auto=format&fit=crop"
                alt="Travel experience"
                width={600}
                height={450}
                loading="lazy"
                decoding="async"
                className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Animated route teaser: a dashed journey path drawing itself between pins. */}
            <div className="relative h-44 w-full rounded-xl bg-primary shadow-lg transition-all duration-300 hover:rotate-0 hover:-translate-y-1 group rotate-2 overflow-hidden">
              <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label="A route drawn between three places on a map">
                <g stroke="currentColor" strokeWidth="0.5" opacity="0.25">
                  <line x1="0" y1="20" x2="200" y2="20" />
                  <line x1="0" y1="50" x2="200" y2="50" />
                  <line x1="0" y1="80" x2="200" y2="80" />
                  <line x1="0" y1="110" x2="200" y2="110" />
                  <line x1="30" y1="0" x2="30" y2="120" />
                  <line x1="80" y1="0" x2="80" y2="120" />
                  <line x1="140" y1="0" x2="140" y2="120" />
                  <line x1="185" y1="0" x2="185" y2="120" />
                </g>
                <path
                  d="M 20 95 C 55 60, 85 105, 115 55 S 165 20, 185 35"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="6 5"
                  className="animate-route-dash"
                />
                {[
                  { x: 20, y: 95, d: '0s' },
                  { x: 115, y: 55, d: '0.6s' },
                  { x: 185, y: 35, d: '1.2s' },
                ].map((pin) => (
                  <g key={`${pin.x}-${pin.y}`} className="animate-pin-drop" style={{ animationDelay: pin.d }}>
                    <circle cx={pin.x} cy={pin.y} r="5.5" fill="#fbbf24" />
                    <circle cx={pin.x} cy={pin.y} r="2" fill="#134e4a" />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
