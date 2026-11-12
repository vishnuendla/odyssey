import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import EmailVerificationBanner from '@/components/auth/EmailVerificationBanner';
import NotificationBell from '@/components/notifications/NotificationBell';

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary'
  }`;

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
    isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary'
  }`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
    <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center" aria-label="Odyssey home">
              <Sun className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="ml-2 text-xl font-bold text-foreground">Odyssey</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <NavLink to="/explore" className={desktopLink}>
              Explore
            </NavLink>
            <NavLink to="/gallery" className={desktopLink}>
              Gallery
            </NavLink>
            <NavLink to="/map" className={desktopLink}>
              Map
            </NavLink>
            <NavLink to="/timeline" className={desktopLink}>
              Timeline
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/journals" className={desktopLink}>
                  My Journals
                </NavLink>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Account menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/bookmarks">Saved Journals</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notifications">Notifications</Link>
                    </DropdownMenuItem>
                    {user?.role === 'ADMIN' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Moderation</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-2 space-y-1 sm:px-3 border-t">
            <NavLink to="/explore" className={mobileLink} onClick={() => setIsOpen(false)}>
              Explore
            </NavLink>
            <NavLink to="/gallery" className={mobileLink} onClick={() => setIsOpen(false)}>
              Gallery
            </NavLink>
            <NavLink to="/map" className={mobileLink} onClick={() => setIsOpen(false)}>
              Map
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/timeline" className={mobileLink} onClick={() => setIsOpen(false)}>
                  Timeline
                </NavLink>
                <NavLink to="/journals" className={mobileLink} onClick={() => setIsOpen(false)}>
                  My Journals
                </NavLink>
                <NavLink to="/bookmarks" className={mobileLink} onClick={() => setIsOpen(false)}>
                  Saved Journals
                </NavLink>
                <NavLink to="/profile" className={mobileLink} onClick={() => setIsOpen(false)}>
                  Profile
                </NavLink>
                <NavLink to="/notifications" className={mobileLink} onClick={() => setIsOpen(false)}>
                  Notifications
                </NavLink>
                {user?.role === 'ADMIN' && (
                  <NavLink to="/admin" className={mobileLink} onClick={() => setIsOpen(false)}>
                    Moderation
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-foreground hover:text-primary px-3 py-2 rounded-md text-base font-medium"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="space-y-1 px-3 py-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login" onClick={() => setIsOpen(false)}>Log in</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register" onClick={() => setIsOpen(false)}>Sign up</Link>
                </Button>
              </div>
            )}

            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-full justify-center"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
                <span className="ml-2">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
    <EmailVerificationBanner />
    </>
  );
}
