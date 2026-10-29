
import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Instagram, Twitter, Facebook, Mail, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <Globe className="h-6 w-6 text-primary" />
              <span className="ml-2 text-lg font-bold">Odyssey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Capture and share your travel experiences with the world. Create beautiful travel journals with photos, maps, and stories.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors">
                  Explore Journals
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-muted-foreground hover:text-primary transition-colors">
                  Travel Map
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-muted-foreground hover:text-primary transition-colors">
                  Create Journal
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
              <a href="https://github.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Odyssey. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
