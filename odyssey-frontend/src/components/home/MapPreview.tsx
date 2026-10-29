
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function MapPreview() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative rounded-xl overflow-hidden h-[400px] shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=2940&auto=format&fit=crop" 
                alt="World map with travel markers" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              
              {/* Simulated map markers */}
              <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary shadow-lg animate-pulse"></div>
              <div className="absolute top-1/3 left-1/2 w-4 h-4 rounded-full bg-primary shadow-lg animate-pulse"></div>
              <div className="absolute top-2/3 left-3/4 w-4 h-4 rounded-full bg-primary shadow-lg animate-pulse"></div>
              <div className="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-primary shadow-lg animate-pulse"></div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-4">Interactive Travel Map</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Visualize your travels on an interactive world map. Each journal entry is pinned to its location, creating a beautiful visual representation of your adventures around the globe.
            </p>
            <p className="text-muted-foreground mb-6">
              Click on any marker to quickly access your journal entry for that location. Filter by date, country, or trip to focus on specific journeys.
            </p>
            <Button asChild>
              <Link to="/map" className="flex items-center">
                Explore the Map <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
