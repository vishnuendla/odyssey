# 🌍 Odyssey - Modern Travel Journal Platform

**Odyssey** is a full-stack travel journal application for documenting, sharing, and exploring travel experiences with images, location data, interactive maps, and community features.

## ✨ Latest Features & Updates

### 🆕 Recently Added Features
- **📍 Geoapify Integration** - Advanced location services with autocomplete and precise geocoding
- **📱 Fully Responsive Design** - Mobile-first approach with perfect tablet and desktop layouts
- **⚡ Performance Optimizations** - Enterprise-level caching, pagination, and database indexing
- **🏢 Complete Legal Pages** - Professional About Us, Privacy Policy, Terms of Service, and Contact pages
- **🔧 Modern Spring Security** - Updated to lambda-based configuration with JWT authentication
- **🎨 Enhanced Timeline** - Beautiful alternating timeline layout with mobile optimization
- **🚀 Production Ready** - Comprehensive error handling and production configuration

## 🌟 Core Features

### 📱 User Experience
- **🔐 Secure Authentication** - JWT-based authentication with password validation and secure sessions
- **📖 Rich Journal Creation** - Advanced text editor with image uploads and location tagging
- **🗺️ Interactive Maps** - Real-time location tracking with Leaflet.js and Geoapify integration
- **📸 Image Management** - Multiple image uploads with optimized storage and display
- **🌐 Social Discovery** - Explore public journals, comments, and community interactions
- **📊 Personal Timeline** - Chronological view of travel experiences with beautiful visualization
- **🎯 Advanced Search** - Location-based search with autocomplete and smart filtering

### 🎨 Design & Interface
- **📱 Mobile-First Design** - Responsive layouts that work flawlessly on all devices
- **🌙 Dark Mode Support** - Elegant dark/light theme switching
- **🎭 Modern UI Components** - Beautiful shadcn/ui components with Tailwind CSS
- **⚡ Smooth Animations** - Polished micro-interactions and transitions
- **🔄 Real-time Updates** - Live data synchronization and immediate feedback

### 🚀 Performance & Scalability
- **⚡ Lightning Fast** - Optimized bundle sizes with Vite build system
- **📊 Database Optimization** - Strategic indexes and connection pooling
- **🗄️ Caching Strategy** - Multi-level caching for improved response times
- **🔍 Smart Pagination** - Efficient handling of large datasets

## 📊 Performance

The repository includes database indexes, pagination, and connection-pool settings. No load-test results or performance benchmarks are currently maintained.

## 🛠️ Technology Stack

### Frontend Architecture
```typescript
React 18 + TypeScript + Vite
├── 🎨 Styling: Tailwind CSS + shadcn/ui
├── 🗺️ Maps: Leaflet.js + React-Leaflet
├── 📍 Location: Geoapify API
├── 📝 Forms: React Hook Form + Zod
├── 🔄 State: React Query + Context API
├── 🎯 Routing: React Router v6
└── 📦 Build: Vite 6
```

### Backend Architecture
```java
Spring Boot 3.2.0 + Java 17
├── 🔐 Security: Spring Security 6 + JWT
├── 🗄️ Database: MySQL 8 + JPA/Hibernate
├── ⚡ Performance: HikariCP + Spring Cache
├── 🔧 Config: Production-ready settings
├── 📊 Monitoring: Optimized queries
└── 🚀 Deployment: Spring profiles
```

## 🏗️ Project Structure

```
odyssey/
├── 🎨 odyssey-frontend/          # React TypeScript SPA
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── auth/            # Authentication forms
│   │   │   ├── journals/        # Journal-related components
│   │   │   ├── layout/          # Navigation and layout
│   │   │   ├── timeline/        # Timeline visualization
│   │   │   └── ui/              # Base UI components
│   │   ├── pages/               # Application pages
│   │   │   ├── About.tsx        # Company information
│   │   │   ├── ContactUs.tsx    # Contact form
│   │   │   ├── PrivacyPolicy.tsx
│   │   │   ├── TermsOfService.tsx
│   │   │   └── ...
│   │   ├── services/            # API integration
│   │   ├── utils/               # Utilities & helpers
│   │   └── types/               # TypeScript definitions
│   ├── public/                  # Static assets
│   └── vite.config.ts          # Vite configuration
├── ⚙️ odyssey-backend/           # Spring Boot API
│   ├── src/main/java/com/odyssey/
│   │   ├── config/             # Security & app configuration
│   │   ├── controller/         # REST API endpoints
│   │   ├── entity/             # JPA entities
│   │   ├── service/            # Business logic
│   │   ├── repository/         # Data access layer
│   │   ├── security/           # JWT & authentication
│   │   └── dto/                # Data transfer objects
│   └── application.properties  # Configuration
├── 📊 database_indexes.sql      # Database optimizations
└── 📖 README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Java** 17+ and Maven 3.6+
- **MySQL** 8.0+
- **Git** for version control

### 🔧 Backend Setup
```powershell
# Clone the repository
git clone https://github.com/vishnuendla/odyssey.git
cd odyssey/odyssey-backend

# Configure database credentials and generate a random JWT signing key.
$env:DB_URL = "jdbc:mysql://localhost:3306/odyssey_db?allowPublicKeyRetrieval=true&useSSL=false&createDatabaseIfNotExist=true"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Verify and run
mvn --batch-mode verify
mvn spring-boot:run
```

### 🎨 Frontend Setup
```powershell
cd ../odyssey-frontend

# Install the locked dependencies
npm ci

# Set up environment variables
Copy-Item .env.example .env.local
# Add your Geoapify key to .env.local. VITE_* variables are included in browser code.

# Start development server
npm run dev

# Build for production
npm run build
```

### 🌐 Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:9090

## 🔧 Configuration

### Environment Variables
```bash
# Frontend (.env.local)
VITE_GEOAPIFY_API_KEY=your_geoapify_key
VITE_NODE_ENV=development

# Backend environment
DB_URL=jdbc:mysql://localhost:3306/odyssey_db
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=base64_encoded_random_key_at_least_32_bytes
JWT_EXPIRATION=86400000
```

Do not commit `.env` files or production credentials. Restrict the Geoapify key in its provider console because frontend keys are visible to browser users.

## ✅ Checks and CI

GitHub Actions runs frontend lint, TypeScript typecheck, and production build, plus backend Maven verification, for pushes and pull requests to `dev` and `main`.

```bash
cd odyssey-frontend
npm ci
npm run lint
npm run typecheck
npm run build

cd ../odyssey-backend
mvn --batch-mode --no-transfer-progress verify
```

There are currently no automated frontend or backend test files. Maven verification compiles and packages the backend but reports “No tests to run.”

### Database Setup
```sql
-- Create database
CREATE DATABASE odyssey_db;

-- Run the optimization indexes
SOURCE database_indexes.sql;
```

## 📱 Key Features Breakdown

### 🔐 Authentication System
- **JWT Token Management** - Secure stateless authentication
- **Password Validation** - Strong password requirements with visual feedback
- **Session Management** - Automatic token refresh and validation
- **OAuth Integration** - Ready for Google/GitHub authentication

### 🗺️ Location Services
- **Geoapify Integration** - Professional geocoding and autocomplete
- **Interactive Maps** - Leaflet.js with custom markers and popups
- **GPS Tracking** - Real-time location capture
- **Location Search** - Smart city/country/place search with suggestions

### 📝 Journal Management
- **Rich Text Editor** - Full-featured content creation
- **Image Upload** - Multiple images with drag-and-drop support
- **Privacy Controls** - Public/private journal settings
- **Advanced Search** - Filter by location, date, tags, and content

### 📊 Timeline & Visualization
- **Chronological Timeline** - Beautiful alternating desktop layout
- **Mobile Optimized** - Single-column mobile timeline
- **Interactive Elements** - Hover effects and smooth transitions
- **Date Grouping** - Organized by month and year

### 🎨 Responsive Design
- **Mobile-First** - Optimized for touch devices
- **Tablet Support** - Perfect medium-screen experience
- **Desktop Enhanced** - Advanced layouts for large screens
- **Cross-Browser** - Tested on all modern browsers

## 🔒 Security Features

### Backend Security
- **Spring Security 6** - Modern lambda-based configuration
- **JWT Authentication** - Stateless token-based auth
- **CORS Configuration** - Proper cross-origin setup
- **Input Validation** - Comprehensive data validation
- **SQL Injection Protection** - Parameterized queries

### Frontend Security
- **XSS Protection** - Sanitized content rendering
- **CSRF Protection** - Cross-site request forgery prevention
- **Secure Storage** - Proper token handling
- **Route Protection** - Authenticated route guards

## 📈 Performance Optimizations

### Database Level
```sql
-- Strategic indexes for common queries
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_created_at ON journals(created_at);
CREATE INDEX idx_journals_location ON journals(latitude, longitude);
CREATE INDEX idx_journals_public ON journals(is_public);
```

### Application Level
- **Connection Pooling** - HikariCP with optimized settings
- **Query Optimization** - Efficient JPA queries with proper joins
- **Caching Strategy** - Spring Cache for frequently accessed data
- **Pagination** - Server-side pagination for large datasets

### Frontend Optimizations
- **Code Splitting** - Automatic route-based splitting
- **Lazy Loading** - Components and images loaded on demand
- **Bundle Optimization** - Tree shaking and dead code elimination
- **Image Optimization** - Responsive images with proper sizing

## 🌐 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
GET  /api/auth/me         # Get current user
POST /api/auth/logout     # User logout
```

### Journal Endpoints
```http
GET    /api/journals           # Get user journals
POST   /api/journals           # Create new journal
GET    /api/journals/{id}      # Get specific journal
PUT    /api/journals/{id}      # Update journal
DELETE /api/journals/{id}      # Delete journal
GET    /api/journals/public    # Get public journals
```

### Location Endpoints
```http
GET /api/locations/search?q={query}  # Search locations
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Run the checks** listed above
4. **Add tests** when introducing behavior that can be covered by automated tests
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes thoroughly

### Development Guidelines
- **Code Style**: Follow existing patterns and linting rules
- **Testing**: Write unit and integration tests
- **Documentation**: Update relevant documentation
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Authors & Contributors

- **Dussa Pranay Saketh**
- **Endla Vishnuvardhan** 
- **Vemula Nivas** 
- **Domakuntla Kavya** 

## 🙏 Acknowledgments

- **Spring Boot Team** - For the excellent backend framework
- **React Team** - For the powerful frontend library
- **Tailwind CSS** - For the utility-first CSS framework
- **Leaflet.js** - For beautiful interactive maps
- **Geoapify** - For reliable location services
- **shadcn/ui** - For beautiful, accessible UI components
- **Open Source Community** - For the incredible ecosystem

## 📞 Support & Contact

- **📧 Email**: Sakethdussa1234@gmail.com
- **📱 Issues**: [GitHub Issues](https://github.com/vishnuendla/odyssey/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/vishnuendla/odyssey/discussions)

---

<div align="center">

**🚀 Ready for Production • 🌍 Global Scale • 📱 Mobile First**

Built with ❤️ by the Odyssey Team

[⭐ Star us on GitHub](https://github.com/usersaketh/odyssey) • [🐛 Report Bug](https://github.com/usersaketh/odyssey/issues) • [💡 Request Feature](https://github.com/usersaketh/odyssey/issues)

</div>
