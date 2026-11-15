import {
  MapPin,
  Lock,
  Share2,
  Route,
  Camera,
  MessageSquareHeart
} from 'lucide-react';
import type { ReactNode } from 'react';

const features: Array<{ icon: ReactNode; title: string; description: string }> = [
  {
    icon: <MapPin className="h-5 w-5" />,
    title: 'Places on the map',
    description: 'Tag where each entry happened and follow your route across an interactive map.'
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Public or private',
    description: 'Every journal is yours to share or keep for yourself. Nothing goes public by accident.'
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: 'Share a story',
    description: 'Send a public entry to anyone by link; they read it without an account.'
  },
  {
    icon: <Route className="h-5 w-5" />,
    title: 'Timeline',
    description: 'Your journeys, in order, from the first trip to the last one.'
  },
  {
    icon: <Camera className="h-5 w-5" />,
    title: 'Photo galleries',
    description: 'Attach photos to an entry and browse them all in one gallery.'
  },
  {
    icon: <MessageSquareHeart className="h-5 w-5" />,
    title: 'Reactions and comments',
    description: 'Answer other travellers right under their stories.'
  }
];

export default function Features() {
  return (
    <section className="py-16 bg-muted/60">
      <div className="container">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl font-semibold mb-4">Everything a travel journal needs</h2>
          <p className="text-lg text-muted-foreground">
            Write the story, pin the place, attach the photos. Odyssey keeps the rest of it organised.
          </p>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex items-start gap-4 py-5 border-t border-border ${
                index === features.length - 1 ? 'border-b md:border-b-0' : ''
              }`}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                {feature.icon}
              </div>
              <div>
                <dt className="font-medium">{feature.title}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
