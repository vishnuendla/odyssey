import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Pages are split per route so the first paint only ships the shell plus the
// landing page. Leaflet and the editor stay out of the initial bundle.
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const CheckEmail = lazy(() => import('@/pages/CheckEmail'));
const Security = lazy(() => import('@/pages/Security'));
const Journals = lazy(() => import('@/pages/Journals'));
const Explore = lazy(() => import('@/pages/Explore'));
const MapView = lazy(() => import('@/pages/MapView'));
const CreateJournal = lazy(() => import('@/pages/CreateJournal'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const JournalView = lazy(() => import('@/pages/JournalView'));
const JournalEdit = lazy(() => import('@/pages/JournalEdit'));
const Profile = lazy(() => import('@/pages/Profile'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const Bookmarks = lazy(() => import('@/pages/Bookmarks'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Admin = lazy(() => import('@/pages/Admin'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const Timeline = lazy(() => import('@/pages/Timeline'));
const Settings = lazy(() => import('@/pages/Settings'));
const About = lazy(() => import('@/pages/About'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const ContactUs = lazy(() => import('@/pages/ContactUs'));

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute requireAuth={false}><Register /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ProtectedRoute requireAuth={false}><ForgotPassword /></ProtectedRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/journals" element={<ProtectedRoute><Journals /></ProtectedRoute>} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/users/:id" element={<PublicProfile />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateJournal /></ProtectedRoute>} />
      <Route path="/journals/:id" element={<JournalView />} />
      <Route path="/journal/edit/:id" element={<ProtectedRoute><JournalEdit /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
