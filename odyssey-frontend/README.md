# Odyssey Frontend

The frontend of the Odyssey travel journal application, built with React, TypeScript, and modern web technologies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # API services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── context/          # React context providers
├── assets/           # Static assets
└── styles/           # Global styles
```

## 🛠️ Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router
- **Maps**: Leaflet.js
- **Forms**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Build Tool**: Vite

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x",
    "react-query": "^4.x",
    "leaflet": "^1.9.x",
    "axios": "^1.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x"
  }
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### API Configuration

API endpoints are configured in `src/config/api.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL;
export const API_ENDPOINTS = {
  auth: '/api/auth',
  journals: '/api/journals',
  // ... other endpoints
};
```

## 🎨 Styling

The project uses Tailwind CSS for styling. Key configuration files:

- `tailwind.config.js`: Tailwind configuration
- `src/styles/globals.css`: Global styles
- `src/styles/animations.css`: Custom animations

## 🗺️ Map Integration

The application uses Leaflet.js for map functionality:

- Map components are in `src/components/map/`
- Map utilities in `src/utils/map.ts`
- Map types in `src/types/map.ts`

## 🔐 Authentication

Authentication is handled using JWT tokens:

- Token management in `src/utils/auth.ts`
- Protected routes in `src/components/auth/ProtectedRoute.tsx`
- Auth context in `src/context/AuthContext.tsx`

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## 📦 Build and Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Debugging

- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console logging with proper log levels

## 🤝 Contributing

1. Follow the TypeScript style guide
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed

## 📚 Documentation

- Component documentation in `src/components/README.md`
- API integration guide in `src/services/README.md`
- Type definitions in `src/types/README.md`
