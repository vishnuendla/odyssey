import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <svg viewBox="0 0 220 72" className="mx-auto mb-6 h-16 w-56 text-accent" aria-hidden="true">
          <path
            d="M 10 50 C 50 20, 90 60, 130 35 S 190 45, 205 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="7 6"
            strokeLinecap="round"
          />
          {/* The route ends here */}
          <g stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round">
            <line x1="199" y1="24" x2="211" y2="36" />
            <line x1="211" y1="24" x2="199" y2="36" />
          </g>
        </svg>
        <h1 className="text-4xl font-semibold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">This page is not on the route</p>
        <Link to="/" className="link-route text-primary underline">
          Return to home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
