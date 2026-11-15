import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';
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
    isActive
      ? 'text-primary underline decoration-dashed decoration-accent underline-offset-4'
      : 'text-muted-foreground hover:text-foreground'
  }`;

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'
  }`;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link to="/" className="flex-shrink-0 flex items-center" aria-label="Odyssey home">
            <LogoMark className="h-7 w-7" />
            <span className="ml-2 text-lg font-semibold tracking-tight">Odyssey</span>
          </Link>
        </div>

        {/* Desktop menu — centered on the bar */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex">
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
          {isAuthenticated && (
            <NavLink to="/journals" className={desktopLink}>
              My Journals
            </NavLink>
          )}
        </div>

        {/* Right cluster — consistent h-9 controls */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="Account menu">
                    <Avatar className="h-9 w-9">
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
            <div className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" className="h-9 px-3" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button className="h-9 px-3" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
          </Button>

          {/* Mobile menu button — morphing hamburger (Uiverse.io galaxy) */}
          <div className="flex items-center pl-1 md:hidden">
            <label className="nav-burger" aria-label="Toggle menu">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(event) => setIsOpen(event.target.checked)}
                aria-expanded={isOpen}
              />
              <span></span>
              <span></span>
              <span></span>
            </label>
          </div>
        </div>
      </div>

      {/* Mobile menu — a clean sheet under the bar */}
      {isOpen && (
        <div className="border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
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
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="space-y-2 px-3 py-2">
                <Button variant="outline" className="w-full" asChild>
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
                className="w-full justify-start"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
                <span className="ml-2">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
    <EmailVerificationBanner />
    </>
  );
}
