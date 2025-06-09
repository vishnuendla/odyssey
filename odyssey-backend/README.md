# Odyssey Backend

The backend service for the Odyssey travel journal application, built with Spring Boot and modern Java technologies.

## 🚀 Quick Start

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

## 🏗️ Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/odyssey/
│   │       ├── config/         # Configuration classes
│   │       ├── controller/     # REST controllers
│   │       ├── model/          # Entity classes
│   │       ├── repository/     # Data repositories
│   │       ├── service/        # Business logic
│   │       ├── security/       # Security configuration
│   │       └── util/           # Utility classes
│   └── resources/
│       ├── application.properties
│       └── application-dev.properties
└── test/                       # Test classes
```

## 🛠️ Technology Stack

- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Security**: Spring Security + JWT
- **API Documentation**: Swagger/OpenAPI
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito

## 📦 Key Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
    </dependency>
</dependencies>
```

## 🔧 Configuration

### Database Configuration

```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/odyssey
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .csrf().disable()
            .authorizeHttpRequests()
            .requestMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
            .and()
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS);
        return http.build();
    }
}
```

## 📝 API Documentation

The API documentation is available at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## 🔐 Authentication

JWT-based authentication is implemented with the following features:
- Token generation and validation
- Role-based access control
- Token refresh mechanism
- Password encryption

## 📊 Database Schema

Key entities:
- User
- Journal
- Location
- Media
- Comment

## 🧪 Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify
```

## 📦 Build and Deployment

```bash
# Build JAR file
mvn clean package

# Run JAR file
java -jar target/odyssey-backend-0.0.1-SNAPSHOT.jar
```

## 🔄 CI/CD

GitHub Actions workflow for:
- Build
- Test
- Docker image creation
- Deployment

## 🤝 Contributing

1. Follow Java code style guide
2. Write unit tests for new features
3. Update API documentation
4. Follow Git commit message conventions

## 📚 Documentation

- API documentation in `docs/api/`
- Database schema in `docs/database/`
- Security documentation in `docs/security/` 