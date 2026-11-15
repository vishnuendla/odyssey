
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Camera, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="relative overflow-hidden px-4 py-14 md:py-24">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=70&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-[0.12] dark:opacity-[0.06] z-0" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
          <div className="space-y-7">
            <p className="eyebrow text-primary">Travel journaling, reimagined</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem]">
              Every mile deserves a story worth returning to
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              Photo-first entries, maps that follow the route, and a calm editor built for the way you actually travel — inspired by the best journal apps in the world.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? '/create' : '/register'}>
                  {isAuthenticated ? 'Write today’s entry' : 'Start free'}
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/explore">Browse public journals</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
              {[
                { icon: MapPin, label: 'Places' },
                { icon: BookOpen, label: 'Rich entries' },
                { icon: Camera, label: 'Galleries' },
                { icon: Globe, label: 'Live maps' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-2.5 py-2 backdrop-blur-sm">
                  <span className="feature-icon-ring h-9 w-9 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-3">
            <div className="col-span-2 overflow-hidden rounded-2xl border border-border/60 shadow-lg card-lift">
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
