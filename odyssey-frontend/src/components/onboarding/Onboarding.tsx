import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Compass, MapPin, PenLine, Sparkles, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingProps {
  hasJournals: boolean;
}

const Onboarding = ({ hasJournals }: OnboardingProps) => {
  const { user } = useAuth();

  const steps = [
    {
      title: 'Finish your profile',
      description: 'Add an avatar and a short bio so other travellers know who you are.',
      done: Boolean(user?.avatar && user?.bio),
      href: '/profile',
      action: 'Edit profile',
      icon: UserRound,
    },
    {
      title: 'Write your first journal',
      description: 'Capture a trip with a title, story, photos and a place on the map.',
      done: hasJournals,
      href: '/create',
      action: 'Create journal',
      icon: PenLine,
    },
    {
      title: 'Explore other travellers',
      description: 'Browse public stories, follow authors and save ideas for your next trip.',
      done: false,
      href: '/explore',
      action: 'Explore',
      icon: Compass,
    },
    {
      title: 'Drop a pin on the map',
      description: 'See every public journey laid out on the interactive map.',
      done: false,
      href: '/map',
      action: 'Open map',
      icon: MapPin,
    },
  ]; 

  const completed = steps.filter((step) => step.done).length;

  return (
    <Card className="mb-8 overflow-hidden border-primary/20">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" /> Welcome to Odyssey
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {completed} of {steps.length} steps done. A few quick steps to get the most out of your journal.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="flex items-start gap-3 rounded-lg border p-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  asChild
                >
                  <Link to={step.href}>
                    <Icon className="mr-1 h-3.5 w-3.5" /> {step.action}
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default Onboarding;
