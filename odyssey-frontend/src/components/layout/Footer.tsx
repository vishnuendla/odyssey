
import { Link } from 'react-router-dom';
import { Mail, Github } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
          <div className="space-y-3">
            <div className="flex items-center">
              <LogoMark className="h-6 w-6" />
              <span className="ml-2 font-display text-lg font-semibold tracking-tight">Odyssey</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Write trip journals with photos, places and maps, share them publicly or keep them private.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/explore" className="link-route text-muted-foreground">
                  Journals
                </Link>
              </li>
              <li>
                <Link to="/map" className="link-route text-muted-foreground">
                  Map
                </Link>
              </li>
              <li>
                <Link to="/create" className="link-route text-muted-foreground">
                  New journal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
              About
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="link-route text-muted-foreground">
                  About Odyssey
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="link-route text-muted-foreground">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="link-route text-muted-foreground">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Connect
            </h3>
            <div className="flex space-x-3">
              <a
                href="mailto:hello@odyssey.app"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-primary"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </a>
              <a
                href="https://github.com/vishnuendla/odyssey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-primary"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Odyssey
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="link-route text-xs text-muted-foreground">
              Privacy policy
            </Link>
            <Link to="/terms" className="link-route text-xs text-muted-foreground">
              Terms of service
            </Link>
            <Link to="/contact" className="link-route text-xs text-muted-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
