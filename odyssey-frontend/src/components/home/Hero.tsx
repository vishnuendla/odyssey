
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Camera, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="relative overflow-hidden px-4 py-12 md:py-20">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=70&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-15 dark:opacity-[0.05] z-0"></div>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Document Your Journey, Share Your Adventures
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
              Write trip journals with photos, tagged places and maps, then share the story when you are ready.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="btn-stamp" asChild>
                <Link to={isAuthenticated ? "/create" : "/register"}>
                  {isAuthenticated ? "Start journaling" : "Create an account"}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/explore">Explore journals</Link>
              </Button>
            </div>
            
            <div className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MapPin className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Location Tagging</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <BookOpen className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Rich Text Editor</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Camera className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium">Photo Galleries</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Globe className="h-4 w-4 text-foreground" />
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
                className="h-56 w-full object-cover"
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
                className="h-44 w-full object-cover"
              />
            </div>
            {/* Animated route teaser: a dashed journey path drawing itself between pins. */}
            <div className="relative h-44 w-full rounded-xl bg-primary shadow-lg transition-all duration-300 hover:rotate-0 hover:-translate-y-1 group rotate-2 overflow-hidden">              <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label="A route drawn between three places on a map">
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
