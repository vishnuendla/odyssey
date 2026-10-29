import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Journals from '@/pages/Journals';
import Explore from '@/pages/Explore';
import MapView from '@/pages/MapView';
import CreateJournal from '@/pages/CreateJournal';
import NotFound from '@/pages/NotFound';
import JournalView from '@/pages/JournalView';
import JournalEdit from '@/pages/JournalEdit';
import Profile from '@/pages/Profile';
import Timeline from '@/pages/Timeline';
import Settings from '@/pages/Settings';
import About from '@/pages/About';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import ContactUs from '@/pages/ContactUs';

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
    <Route path="/register" element={<ProtectedRoute requireAuth={false}><Register /></ProtectedRoute>} />
    <Route path="/journals" element={<ProtectedRoute><Journals /></ProtectedRoute>} />
    <Route path="/explore" element={<Explore />} />
    <Route path="/map" element={<MapView />} />
    <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
    <Route path="/create" element={<ProtectedRoute><CreateJournal /></ProtectedRoute>} />
    <Route path="/journals/:id" element={<JournalView />} />
    <Route path="/journal/edit/:id" element={<ProtectedRoute><JournalEdit /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/about" element={<About />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
    <Route path="/contact" element={<ContactUs />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes; 