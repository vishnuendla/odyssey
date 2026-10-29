
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CreateJournalForm from '@/components/journals/CreateJournalForm';

const CreateJournalPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Navbar />
      <main className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Create New Journal</h1>
        <CreateJournalForm />
      </main>
      <Footer />
    </>
  );
};

export default CreateJournalPage;
