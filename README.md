# Odyssey - Travel Journal Application

Odyssey is a modern travel journal application that allows users to document their travel experiences with rich media content, location tracking, and interactive maps.

## 🌟 Features

- User authentication and authorization
- Interactive map view of travel locations
- Rich text journal entries with image support
- Location-based journal organization
- Responsive design for all devices
- Real-time location search and geocoding
- Secure data storage and management

## 🏗️ Project Structure

```
odyssey/
├── frontend/           # React TypeScript frontend
├── backend/           # Spring Boot backend
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Java 17 or higher
- Maven
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/odyssey.git
   cd odyssey
   ```

2. Set up the backend:
   ```bash
   cd backend
   mvn clean install
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080

## 🔧 Configuration

### Backend Configuration
- Database configuration in `backend/src/main/resources/application.properties`
- JWT secret key configuration
- Email service configuration

### Frontend Configuration
- API endpoint configuration in `frontend/src/config/api.ts`
- Environment variables in `.env` file

## 🛠️ Technology Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Leaflet.js for maps
- React Query
- React Router

### Backend
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT Authentication
- Maven

## 📝 API Documentation

API documentation is available at `/api-docs` when running the backend server.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Spring Boot team
- React team
- All contributors and supporters 