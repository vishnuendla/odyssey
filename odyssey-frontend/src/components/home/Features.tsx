import { 
  MapPin, 
  Lock, 
  Share2, 
  Globe, 
  Camera, 
  MessageSquareHeart 
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: 'Location Tagging',
      description: 'Tag your exact location for each journal entry and visualize your travel path on interactive maps.'
    },
    {
      icon: <Lock className="h-8 w-8 text-primary" />,
      title: 'Privacy Controls',
      description: 'Choose which journals to share publicly and which to keep private for your eyes only.'
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: 'Easy Sharing',
      description: 'Share your travel experiences with friends, family, or the world with customizable sharing options.'
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: 'Travel Timeline',
      description: 'View your travel history in a beautiful timeline that showcases your journeys chronologically.'
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: 'Photo Galleries',
      description: 'Attach unlimited photos to your journal entries to capture every memorable moment.'
    },
    {
      icon: <MessageSquareHeart className="h-8 w-8 text-primary" />,
      title: 'Engage with Journals',
      description: 'React and comment on others’ travel stories to connect and share the vibes.'
    }
  ];
  
  return (
    <section className="py-16 bg-gray-200 dark:bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Designed for Travelers</h2>
          <p className="text-lg text-muted-foreground">
            Odyssey provides all the tools you need to document and share your travel experiences beautifully.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 inline-block rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
