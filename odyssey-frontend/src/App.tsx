import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { AppRoutes } from '@/routes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <JournalProvider>
              <AppRoutes />
              <Toaster />
            </JournalProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
