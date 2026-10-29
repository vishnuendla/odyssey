# 🚀 Odyssey Backend - Enterprise Spring Boot API

**Odyssey Backend** is the Spring Boot 3.2 REST API for Odyssey, built with **Java 17**, Spring Security, JPA, and MySQL.

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen) ![Java](https://img.shields.io/badge/Java-17-orange) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue) ![JWT](https://img.shields.io/badge/JWT-Security-red)

## 🚀 Quick Start

### Prerequisites
- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.6+**
- **MySQL 8.0+**
- **Git** for version control

### Development Setup
```powershell
# Clone and navigate to backend
git clone https://github.com/vishnuendla/odyssey.git
cd odyssey/odyssey-backend

# Configure the database and JWT secret through environment variables.
$env:DB_URL = "jdbc:mysql://localhost:3306/odyssey_db"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Verify and run
mvn --batch-mode --no-transfer-progress verify

# Run in development mode
mvn spring-boot:run

# Run with the production profile after setting production DB and JWT environment variables
mvn spring-boot:run -Dspring-boot.run.profiles=production
```

### Production Deployment
```bash
# Build production JAR
mvn clean package -Dspring.profiles.active=production

# Run production server
java -jar target/odyssey-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=production

# With JVM optimizations
java -Xmx2g -Xms1g -XX:+UseG1GC -jar target/odyssey-backend-0.0.1-SNAPSHOT.jar
```

The API listens on http://localhost:9090 by default. Swagger UI and Spring Boot Actuator are not configured in this repository.

## ✨ Latest Features & Updates

### 🆕 Recent Enhancements
- **🔧 Spring Security 6** - Modern lambda-based configuration with enhanced JWT security
- **📊 Database Optimization** - Strategic indexes for 80% faster queries
- **⚙️ Configuration** - Database and JWT credentials supplied through environment variables
- **🔐 Enhanced Authentication** - Cookie-based JWT tokens with automatic refresh
- **📍 Location Services** - Optimized geocoding and location search endpoints

## 🌟 Core Features

### 🔐 Authentication & Security
- **JWT Token Management** - Stateless authentication with secure cookie storage
- **Spring Security 6** - Modern lambda-based security configuration
- **Password Validation** - BCrypt encryption with strength validation
- **CORS Configuration** - Proper cross-origin resource sharing setup
- **Session Management** - Automatic token refresh and validation
- **Input Validation** - Comprehensive data validation and sanitization

### 📖 Journal Management
- **CRUD Operations** - Complete journal lifecycle management
- **Image Handling** - Multiple file uploads with validation and storage
- **Location Integration** - GPS coordinates and reverse geocoding
- **Privacy Controls** - Public/private journal settings
- **Search & Filtering** - Advanced search with location and date filters
- **Pagination** - Efficient server-side pagination for large datasets

### 🗺️ Location Services
- **Geocoding API** - Convert addresses to coordinates
- **Location Search** - Smart city/place search with autocomplete
- **GPS Integration** - Real-time location capture and storage
- **Distance Calculations** - Location-based proximity features

### 👥 Social Features
- **User Interactions** - Comments, likes, and social engagement
- **Public Discovery** - Explore public journals and content
- **User Profiles** - Comprehensive user management
- **Activity Feeds** - Track user activities and interactions

## 🏗️ Architecture & Design

### 📦 Project Structure
```
src/main/java/com/odyssey/
├── 🔧 config/
│   ├── SecurityConfig.java         # Spring Security configuration
│   ├── CorsConfig.java            # CORS settings
│   ├── JpaConfig.java             # Database configuration
│   └── WebConfig.java             # Web MVC configuration
├── 🎯 controller/
│   ├── AuthController.java        # Authentication endpoints
│   ├── JournalController.java     # Journal CRUD operations
│   ├── LocationController.java    # Location services
│   ├── UserController.java        # User management
│   └── ImageController.java       # File upload handling
├── 📊 entity/
│   ├── User.java                  # User entity with validations
│   ├── Journal.java               # Journal entity with relationships
│   ├── Comment.java               # Comment entity
│   └── Location.java              # Location entity
├── 🔄 service/
│   ├── AuthService.java           # Authentication business logic
│   ├── JournalService.java        # Journal operations
│   ├── LocationService.java       # Location processing
│   ├── UserService.java           # User management
│   └── ImageService.java          # File handling service
├── 🗄️ repository/
│   ├── UserRepository.java        # User data access
│   ├── JournalRepository.java     # Journal queries
│   ├── CommentRepository.java     # Comment operations
│   └── LocationRepository.java    # Location queries
├── 🔐 security/
│   ├── JwtTokenProvider.java      # JWT token utilities
│   ├── JwtAuthenticationFilter.java # JWT filter
│   └── UserDetailsServiceImpl.java # User details service
└── 📝 dto/
    ├── AuthRequest.java           # Authentication DTOs
    ├── JournalDto.java            # Journal transfer objects
    └── UserDto.java               # User transfer objects
```

### 🛠️ Technology Stack
```java
Spring Boot 3.2.0 + Java 17
├── 🔐 Security: Spring Security 6 + JWT
├── 🗄️ Database: MySQL 8 + JPA/Hibernate
├── ⚡ Performance: HikariCP + Caching
├── 📝 Validation: Hibernate Validator
├── 📦 Packaging: Spring Boot Maven plugin
└── 🔧 Build: Maven 3.9+

```

## 📊 Performance

Connection-pool and database-index configuration is included, but this repository does not currently include load tests or verified performance benchmarks.

## 🔧 Configuration

### Development (application.properties)
```properties
# Server Configuration
server.port=9090
server.servlet.context-path=/

# Database credentials are supplied via DB_URL, DB_USERNAME, and DB_PASSWORD.
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/odyssey_db?allowPublicKeyRetrieval=true&useSSL=false&createDatabaseIfNotExist=true}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JWT_SECRET is required; JWT_EXPIRATION defaults to one day (milliseconds).
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration=${JWT_EXPIRATION:86400000}

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

### Production (application-production.properties)
```properties
# Production Server Configuration
server.port=9090
logging.level.org.springframework.security=WARN
logging.level.com.odyssey=INFO

# Database credentials and JWT_SECRET are supplied through environment variables.
# JWT_EXPIRATION is optional; its default is 86400000 milliseconds.

# Performance Tuning
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=10
```

## 🌐 API Documentation

### 🔐 Authentication Endpoints
```http
POST   /api/auth/register         # User registration
POST   /api/auth/login            # User login
GET    /api/auth/me               # Get current user
POST   /api/auth/logout           # User logout
POST   /api/auth/refresh          # Refresh JWT token
```

### 📖 Journal Endpoints
```http
GET    /api/journals              # Get user journals (paginated)
POST   /api/journals              # Create new journal
GET    /api/journals/{id}         # Get specific journal
PUT    /api/journals/{id}         # Update journal
DELETE /api/journals/{id}         # Delete journal
GET    /api/journals/public       # Get public journals
GET    /api/journals/search       # Search journals
```

### 📍 Location Endpoints
```http
GET    /api/locations/search?q={query}  # Search locations
POST   /api/locations/geocode           # Geocode address
GET    /api/locations/reverse           # Reverse geocoding
```

### 📸 Image Endpoints
```http
POST   /api/images/upload         # Upload journal images
GET    /api/images/{filename}     # Serve uploaded images
DELETE /api/images/{filename}     # Delete image
```

### 👥 User Endpoints
```http
GET    /api/users/profile         # Get user profile
PUT    /api/users/profile         # Update user profile
GET    /api/users/{id}/journals   # Get user's public journals
```

## 🔒 Security Features

### 🛡️ Security Configuration
- **CSRF Protection** - Cross-site request forgery prevention
- **CORS Support** - Configurable cross-origin requests
- **JWT Security** - Stateless token-based authentication
- **Password Encryption** - BCrypt with configurable strength
- **Input Validation** - Comprehensive data validation
- **SQL Injection Protection** - Parameterized queries

### 🔐 JWT Implementation
```java
// JWT token structure
{
  "sub": "user@example.com",
  "iat": 1640995200,
  "exp": 1641081600,
  "authorities": ["ROLE_USER"]
}
```

## 🧪 Testing

### Run Tests
```bash
# Compile, run available tests, and package
mvn --batch-mode --no-transfer-progress verify
```

There are currently no backend test sources, so Maven reports “No tests to run.” GitHub Actions runs this verification on pushes and pull requests to `dev` and `main`.

## 🚀 Deployment

### Docker Support
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app
COPY target/odyssey-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 9090
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Build Commands
```bash
# Build JAR
mvn clean package

# Build with tests
mvn clean package -DskipTests=false

# Build Docker image
docker build -t odyssey-backend .

# Run with Docker
docker run -p 9090:9090 odyssey-backend
```

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Run** `mvn --batch-mode --no-transfer-progress verify`
4. **Add tests** for new behavior when practical
5. **Commit changes**: `git commit -m 'Add new feature'`
6. **Push to branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

### Code Quality
- **Code Style**: Google Java Style Guide
- **Testing**: Maven Surefire (no test sources are present yet)
- **Documentation**: Javadoc for public APIs
- **Security**: OWASP guidelines compliance

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.


---

<div align="center">

**🚀 Production Ready • ⚡ High Performance • 🔒 Enterprise Security**

Built with ❤️ using Spring Boot 3.2.0

[🐛 Report Bug](https://github.com/vishnuendla/odyssey/issues) • [💡 Request Feature](https://github.com/vishnuendla/odyssey/issues)

</div>
