import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RegisterForm from '@/components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px-300px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RegisterPage;
