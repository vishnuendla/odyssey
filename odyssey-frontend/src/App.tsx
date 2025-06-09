
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { JournalProvider } from "./contexts/JournalContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Journals from "./pages/Journals";
import Explore from "./pages/Explore";
import MapView from "./pages/MapView";
import CreateJournal from "./pages/CreateJournal";
import NotFound from "./pages/NotFound";
import JournalView from "./pages/JournalView";
import JournalEdit from "./pages/JournalEdit";
import Profile from "./pages/Profile";
import Timeline from "./pages/Timeline";
import Settings from "./pages/Settings";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <JournalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/journals" element={<Journals />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/create" element={<CreateJournal />} />
                <Route path="/journals/:id" element={<JournalView />} />
                <Route path="/journal/edit/:id" element={<JournalEdit />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </JournalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
