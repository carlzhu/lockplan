# LockPlan

LockPlan is a comprehensive task management application built with Spring Boot and React. It helps users organize their tasks, set priorities, and manage deadlines efficiently.

## Features

- User authentication and authorization
- Task creation, editing, and deletion
- Task categorization and prioritization
- Dashboard with task statistics
- Dark mode support
- AI-powered task processing from natural language input

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.1.0
- Spring Security with JWT authentication
- JPA/Hibernate
- H2 Database (for development)

### Frontend
- React 18
- React Router 6
- Material-UI 5
- Formik & Yup for form validation
- Axios for API communication

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- Maven 3.6 or higher

### Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/carlzhu/lockplan.git
   cd lockplan
   ```

2. Start the backend:
   ```
   ./run-dev.sh
   ```

3. Start the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```

4. Access the application at http://localhost:3000

## Demo Credentials

- Username: demo
- Password: password

## Mobile Version

A React Native version of this application is planned for future development to enable mobile access.