
import { Link } from 'react-router-dom';
import { Mail, Github } from 'lucide-react';
import LogoMark from '@/components/brand/LogoMark';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <LogoMark className="h-5 w-5" />
              <span className="ml-2 text-lg font-semibold">Odyssey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Write trip journals with photos, places and maps, share them publicly or keep them private.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="font-medium text-base mb-4">About</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="font-medium text-base mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="mailto:hello@odyssey.app"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
              <a
                href="https://github.com/vishnuendla/odyssey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Odyssey
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
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
