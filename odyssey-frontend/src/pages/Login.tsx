import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoginForm from '@/components/auth/LoginForm';
import LogoMark from '@/components/brand/LogoMark';
import { MapPin, BookOpen, Camera } from 'lucide-react';

const brandFeatures = [
  {
    icon: MapPin,
    title: 'Every place you pass through',
    description: 'Pin cities, trails and quiet corners as the journey unfolds.',
  },
  {
    icon: BookOpen,
    title: 'Entries that read like stories',
    description: 'Write day by day, and let the whole trip become a narrative.',
  },
  {
    icon: Camera,
    title: 'Photos that lead the way',
    description: 'Your best shots sit up front; the details stay close at hand.',
  },
];

const LoginPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px-300px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-16 lg:items-stretch">
          <aside
            aria-hidden="true"
            className="hidden lg:flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10"
          >
            <div>
              <LogoMark className="h-10 w-10" />
              <p className="mt-8 text-3xl font-semibold tracking-tight text-balance">
                Where your journeys find a home.
              </p>
              <p className="mt-3 text-muted-foreground">
                Sign in and pick up right where the last entry left off.
              </p>

              <ul className="mt-10 space-y-6">
                {brandFeatures.map((feature) => (
                  <li key={feature.title} className="flex gap-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{feature.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {feature.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">Odyssey — a travel journal for the long way round.</p>
          </aside>

          <div className="w-full max-w-md mx-auto lg:mx-0 lg:self-center">
            <div className="flex justify-center mb-6 lg:hidden">
              <LogoMark className="h-12 w-12" />
            </div>
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LoginPage;
