import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PLACES = [
  { x: 120, y: 150, label: 'Lisbon', d: '0s' },
  { x: 300, y: 95, label: 'Reykjavík', d: '0.4s' },
  { x: 470, y: 190, label: 'Petra', d: '0.8s' },
  { x: 640, y: 130, label: 'Kyoto', d: '1.2s' },
];

export default function MapPreview() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            {/* Crafted map card: graticule, one route drawing itself, pinned places */}
            <div className="relative rounded-xl overflow-hidden h-[400px] border border-border bg-card shadow-sm">
              <svg viewBox="0 0 800 300" className="h-full w-full" role="img" aria-label="A travel route crossing a map, with four pinned places">
                <g stroke="hsl(var(--border))" strokeWidth="1">
                  {Array.from({ length: 15 }, (_, i) => (
                    <line key={`v${i}`} x1={(i + 1) * 50} y1="0" x2={(i + 1) * 50} y2="300" />
                  ))}
                  {Array.from({ length: 5 }, (_, i) => (
                    <line key={`h${i}`} x1="0" y1={(i + 1) * 50} x2="800" y2={(i + 1) * 50} />
                  ))}
                </g>
                <path
                  d="M 120 150 C 200 220, 260 40, 300 95 S 400 260, 470 190 S 590 60, 640 130"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="7 6"
                  className="animate-route-dash"
                />
                {PLACES.map((place) => (
                  <g key={place.label} className="animate-pin-drop" style={{ animationDelay: place.d }}>
                    <circle cx={place.x} cy={place.y} r="7" fill="hsl(var(--accent))" />
                    <circle cx={place.x} cy={place.y} r="2.5" fill="hsl(var(--card))" />
                    <text
                      x={place.x}
                      y={place.y - 14}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      fontSize="12"
                      fontFamily="ui-monospace, monospace"
                    >
                      {place.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-semibold mb-4">Your travels on one map</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Every journal entry is pinned to where it happened. Open the map and follow the route you actually took.
            </p>
            <p className="text-muted-foreground mb-6">
              Click a marker to open the entry for that place, or filter by country and date to focus on one journey.
            </p>
            <Button asChild>
              <Link to="/map" className="flex items-center">
                Open the map <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
