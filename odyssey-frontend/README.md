# 🎨 Odyssey Frontend - Modern React TypeScript SPA

**Odyssey Frontend** is the React 18 and TypeScript single-page application for creating and exploring travel journals.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **Git** for version control

### Development Setup
```bash
# Clone and navigate to frontend
git clone https://github.com/vishnuendla/odyssey.git
cd odyssey/odyssey-frontend

# Install the locked dependencies
npm ci

# Copy environment template
cp .env.example .env.local
# Add your Geoapify key to .env.local. VITE_* values are visible in browser code.

# Start development server with HMR
npm run dev

# Start with host exposure (for mobile testing)
npm run dev -- --host
```

### Production Build
```bash
# Build for production with optimizations
npm run build

# Preview production build locally
npm run preview

```

**🌐 Development URLs:**
- **Local**: http://localhost:3000
- **Network**: http://your-ip:3000 (with --host flag)
- **Production Preview**: http://localhost:4173

## ✨ Latest Features & Updates

### 🆕 Recent Enhancements
- **📱 Fully Responsive Design** - Mobile-first approach with perfect tablet and desktop layouts
- **📍 Geoapify Integration** - Advanced location services with autocomplete and precise geocoding
- **🎨 Modern UI Components** - Beautiful shadcn/ui components with Tailwind CSS design system
- **⚡ Performance Optimizations** - Code splitting, lazy loading, and bundle optimization
- **🗺️ Interactive Maps** - Enhanced Leaflet.js integration with custom markers and popups
- **🌙 Dark Mode Support** - Elegant theme switching with system preference detection
- **🚀 Production Optimizations** - Advanced Vite configuration for enterprise deployment

## 🌟 Core Features

### 🎨 User Interface
- **📱 Mobile-First Design** - Responsive layouts optimized for all device sizes
- **🎭 Modern Components** - shadcn/ui component library with custom theming
- **🌙 Dark/Light Mode** - Seamless theme switching with persistence
- **⚡ Smooth Animations** - Framer Motion for polished micro-interactions
- **🎯 Accessibility** - WCAG 2.1 AA compliant with keyboard navigation
- **🔄 Loading States** - Skeleton loaders and progressive enhancement

### 🔐 Authentication & Security
- **🔒 JWT Authentication** - Secure token-based authentication with automatic refresh
- **🛡️ Protected Routes** - Route guards with role-based access control
- **🔐 Secure Storage** - Proper token handling with HTTP-only cookies
- **⚠️ XSS Protection** - Content sanitization and secure rendering
- **🔍 Input Validation** - Real-time validation with Zod schemas

### 📖 Journal Management
- **✏️ Rich Text Editor** - Advanced editor with formatting and image insertion
- **📸 Image Handling** - Drag-and-drop uploads with preview and optimization
- **🗺️ Location Integration** - Interactive maps with GPS tracking and search
- **🔍 Smart Search** - Debounced search with filters and sorting
- **📊 Timeline View** - Beautiful chronological layout with date grouping
- **👁️ Privacy Controls** - Public/private settings with visual indicators

### 🗺️ Maps & Location
- **🌍 Interactive Maps** - Leaflet.js with custom markers and popups
- **📍 Location Services** - Geoapify integration for geocoding and autocomplete
- **🎯 GPS Integration** - Real-time location capture with permission handling
- **🔍 Place Search** - Smart location search with suggestions
- **📏 Distance Calculation** - Location-based proximity features

## 🏗️ Architecture & Design

### 📦 Project Structure
```
src/
├── 🎨 components/
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx        # Login form with validation
│   │   ├── RegisterForm.tsx     # Registration form
│   │   └── ProtectedRoute.tsx   # Route protection
│   ├── journals/                # Journal-related components
│   │   ├── JournalCard.tsx      # Journal display card
│   │   ├── JournalForm.tsx      # Journal creation/edit form
│   │   ├── JournalList.tsx      # Paginated journal list
│   │   └── JournalDetail.tsx    # Detailed journal view
│   ├── layout/                  # Layout and navigation
│   │   ├── Navbar.tsx           # Main navigation bar
│   │   ├── Footer.tsx           # Site footer with links
│   │   ├── Sidebar.tsx          # Mobile-responsive sidebar
│   │   └── Layout.tsx           # Main layout wrapper
│   ├── timeline/                # Timeline visualization
│   │   ├── Timeline.tsx         # Main timeline component
│   │   ├── TimelineItem.tsx     # Individual timeline entry
│   │   └── TimelineFilter.tsx   # Timeline filtering
│   ├── maps/                    # Map components
│   │   ├── InteractiveMap.tsx   # Main map component
│   │   ├── LocationPicker.tsx   # Location selection tool
│   │   └── MarkerPopup.tsx      # Custom map markers
│   └── ui/                      # Base UI components (shadcn/ui)
│       ├── button.tsx           # Button component
│       ├── input.tsx            # Input component
│       ├── card.tsx             # Card component
│       └── ...                  # Other UI primitives
├── 📄 pages/                    # Application pages
│   ├── Home.tsx                 # Landing page
│   ├── Dashboard.tsx            # User dashboard
│   ├── JournalPage.tsx          # Journal view page
│   ├── About.tsx                # About us page
│   ├── ContactUs.tsx            # Contact form page
│   ├── PrivacyPolicy.tsx        # Privacy policy
│   └── TermsOfService.tsx       # Terms of service
├── 🔧 services/                 # API integration
│   ├── authService.ts           # Authentication API calls
│   ├── journalService.ts        # Journal CRUD operations
│   ├── locationService.ts       # Location services
│   └── imageService.ts          # Image upload handling
├── 🛠️ utils/                    # Utilities and helpers
│   ├── geocoding.ts             # Geoapify integration
│   ├── validation.ts            # Zod validation schemas
│   ├── dateUtils.ts             # Date formatting utilities
│   └── imageUtils.ts            # Image processing helpers
├── 🎯 hooks/                    # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useGeolocation.ts        # GPS location hook
│   ├── useDebounce.ts           # Debouncing hook
│   └── useLocalStorage.ts       # Local storage hook
├── 🌐 contexts/                 # React contexts
│   ├── AuthContext.tsx          # Authentication context
│   ├── ThemeContext.tsx         # Theme management
│   └── NotificationContext.tsx  # Toast notifications
├── 📝 types/                    # TypeScript definitions
│   ├── auth.ts                  # Authentication types
│   ├── journal.ts               # Journal types
│   ├── location.ts              # Location types
│   └── api.ts                   # API response types
└── 🎨 styles/                   # Styling and themes
    ├── globals.css              # Global styles
    ├── components.css           # Component-specific styles
    └── themes.css               # Theme definitions
```

### 🛠️ Technology Stack
```typescript
React 18 + TypeScript + Vite
├── 🎨 Styling: Tailwind CSS + shadcn/ui
├── 🗺️ Maps: Leaflet.js + React-Leaflet
├── 📍 Location: Geoapify API
├── 📝 Forms: React Hook Form + Zod
├── 🔄 State: React Query + Context API
├── 🎯 Routing: React Router v6
├── 🌙 Theme: next-themes
├── 📦 Build: Vite with optimizations
└── 🧪 Checks: ESLint + TypeScript typecheck
```

## ⚡ Performance Optimizations

### 🚀 Bundle Optimization
```typescript
// Vite configuration highlights
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['leaflet', 'react-leaflet'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'leaflet']
  }
})
```

### 📊 Build Output

The current production build emits a JavaScript chunk larger than Vite's 500 kB warning threshold. The project does not currently maintain Lighthouse or load-test results.

### 🔧 Optimization Features
- **Code Splitting** - Automatic route-based and component-based splitting
- **Lazy Loading** - Images and components loaded on demand
- **Tree Shaking** - Dead code elimination for smaller bundles
- **Image Optimization** - Responsive images with proper sizing
- **Debouncing** - Search and input debouncing for better UX
- **Memoization** - React.memo and useMemo for expensive operations

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Geoapify key (browser-visible; restrict it in the provider console)
VITE_GEOAPIFY_API_KEY=your_geoapify_api_key_here
# Optional development logging
VITE_NODE_ENV=development
```

### Tailwind Configuration (tailwind.config.ts)
```typescript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
```

### Vite Configuration

Vite serves the app on port `3000`, uses `@` as an alias for `src/`, and proxies `/api` requests to `http://localhost:9090`. See [`vite.config.ts`](vite.config.ts) for the current configuration.

## 🎨 Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-500: #6b7280;
  --gray-900: #111827;
}
```

### Typography
```css
/* Font Families */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
/* xs: 0px - 639px (Mobile) */
/* sm: 640px+ (Large Mobile) */
/* md: 768px+ (Tablet) */
/* lg: 1024px+ (Desktop) */
/* xl: 1280px+ (Large Desktop) */
/* 2xl: 1536px+ (Extra Large) */
```

### Component Responsiveness
- **Timeline**: Alternating desktop layout → single column mobile
- **Navigation**: Desktop horizontal → mobile hamburger menu
- **Forms**: Full width mobile → constrained desktop
- **Maps**: Full viewport mobile → embedded desktop
- **Cards**: Single column mobile → grid desktop


## 🚀 Deployment

### Build Commands
```bash
# Production build
npm run build

# Lint code
npm run lint

# Check TypeScript types
npm run typecheck
```

Automated frontend test files are not currently configured. GitHub Actions runs lint, typecheck, and the production build on pushes and pull requests to `dev` and `main`.

## 🌙 Dark Mode Implementation

### Theme System
```typescript
// Theme context with system preference detection
const ThemeContext = createContext({
  theme: 'system' as 'light' | 'dark' | 'system',
  setTheme: (theme: string) => {}
})

// Automatic system preference detection
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (e: MediaQueryListEvent) => {
    if (theme === 'system') {
      setTheme(e.matches ? 'dark' : 'light')
    }
  }
  mediaQuery.addEventListener('change', handleChange)
  return () => mediaQuery.removeEventListener('change', handleChange)
}, [theme])
```

## 🔍 SEO & Accessibility

### Meta Tags
```html
<!-- Dynamic meta tags for better SEO -->
<meta name="description" content="Odyssey - Document your travel adventures with interactive maps and rich content" />
<meta property="og:title" content="Odyssey Travel Journal" />
<meta property="og:description" content="Create beautiful travel journals with photos, maps, and memories" />
<meta name="twitter:card" content="summary_large_image" />
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.
---

<div align="center">

**🚀 Production Ready • 📱 Mobile First • ⚡ Lightning Fast**

Built with ❤️ using React 18 + TypeScript + Vite

[🐛 Report Bug](https://github.com/vishnuendla/odyssey/issues) • [💡 Request Feature](https://github.com/vishnuendla/odyssey/issues)

</div>
