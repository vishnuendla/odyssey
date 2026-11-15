import PageShell from '@/components/layout/PageShell';
import AuthSplitLayout from '@/components/layout/AuthSplitLayout';
import RegisterForm from '@/components/auth/RegisterForm';
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

const RegisterPage = () => {
  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-18rem)] items-center justify-center px-4 py-12 sm:px-6">
        <AuthSplitLayout
          title="Start your first journal today."
          subtitle="One account, every trip — from the weekend away to the year abroad."
          features={brandFeatures}
        >
          <div className="mb-6 flex justify-center lg:hidden">
            <LogoMark className="h-12 w-12" />
          </div>
          <RegisterForm />
        </AuthSplitLayout>
      </div>
    </PageShell>
  );
};

export default RegisterPage;
