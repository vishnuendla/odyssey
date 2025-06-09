# Odyssey - Travel Journal Web App

Odyssey is a full-stack travel journaling platform where users can create, tag, and share their travel experiences with text, images, maps, and more. Built with **React (TypeScript)** and **Spring Boot (Java)**, it offers a seamless, interactive travel log experience.

---

## 🚀 Tech Stack

### Frontend:
- **React (TypeScript)**
- **Vite**
- **Tailwind CSS / ShadCN**
- **Axios**
- **React Router**
- **Leaflet** (for maps)

### Backend:
- **Spring Boot 3.4.4** (Java 21)
- **Spring Security** (JWT, Role-based)
- **MySQL**
- **JPA & Hibernate**
- **REST APIs**

---

## 📦 Features
- 🔐 **User Authentication** (JWT-based)
- 📝 **Create, Edit, Delete Travel Journals**
- 📸 **Media Uploads**
- 📍 **Location Tagging with Maps**
- 📅 **Timeline View**
- 💬 **Comments & Reactions**
- 🌐 **Multilingual Support**
- 🌗 **Light/Dark Theming**
- 🖱️ **Animated Custom Cursor**

---

## 🛠️ Setup Instructions

### 🧪 Backend (Spring Boot)
1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/odyssey.git
    cd odyssey/backend
    ```
2. Update DB credentials in `application.properties`:
    ```properties
    spring.datasource.url=jdbc:mysql://localhost:3306/odyssey_db?allowPublicKeyRetrieval=true&useSSL=false
    spring.datasource.username=root
    spring.datasource.password=root
    spring.jpa.hibernate.ddl-auto=update
    ```
3. Run the server:
    ```bash
    ./mvnw clean install
    ./mvnw spring-boot:run
    ```
    Server runs on: [http://localhost:9090](http://localhost:9090)

### 💻 Frontend (React + Vite)
1. Navigate to the frontend folder:
    ```bash
    cd ../frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the development server:
    ```bash
    npm run dev
    ```
    App runs on: [http://localhost:3000](http://localhost:3000)

---

## 🔄 Vite Proxy Config (`vite.config.ts`)
```ts
export default defineConfig({
  plugins: [react()],
  server: {
     port: 3000,
     proxy: {
        '/api': {
          target: 'http://localhost:9090',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
     },
  },
});
```

---

## 🔐 CORS Config (Spring Boot)
```java
@Configuration
public class WebConfig {
     @Bean
     public WebMvcConfigurer corsConfigurer() {
          return new WebMvcConfigurer() {
                public void addCorsMappings(CorsRegistry registry) {
                     registry.addMapping("/**")
                                .allowedOrigins("http://localhost:3000")
                                .allowedMethods("*")
                                .allowCredentials(true);
                }
          };
     }
}
```

---

## 📁 Folder Structure
```plaintext
/odyssey
├── /backend (Spring Boot app)
├── /frontend (React + Vite app)
```

---

## 📸 Screenshots
*(Add some screenshots here when ready — UI, maps, journals, etc.)*

---

## 🤝 Contributors
- **Dussa Pranay Saketh** – Developer

---

## 📌 TODO (Next Steps)
- [ ] Unit & Integration Tests
- [ ] Mobile Responsiveness
- [ ] Dockerize App
- [ ] CI/CD with GitHub Actions
