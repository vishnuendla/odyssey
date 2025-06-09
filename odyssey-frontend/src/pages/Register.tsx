
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RegisterForm from '@/components/auth/RegisterForm';
import { Globe } from 'lucide-react';

const RegisterPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px-300px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <Globe className="h-12 w-12 text-primary" />
          </div>
          <RegisterForm />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RegisterPage;
