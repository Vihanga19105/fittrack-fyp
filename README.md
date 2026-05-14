# FitTrack - Online Fitness Management Platform

FitTrack is a full-stack online fitness management platform developed as a Final Year Project. The system supports clients, trainers, and administrators through role-based dashboards and fitness management services. It includes trainer discovery, subscription payments, workout and meal planning, progress tracking, admin management, and a machine learning-based goal prediction feature.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Technologies Used](#technologies-used)
- [System Requirements](#system-requirements)
- [Manual Installation and Setup](#manual-installation-and-setup)
- [Docker Setup](#docker-setup)
- [Demo Accounts](#demo-accounts)
- [Testing](#testing)
- [Important Notes](#important-notes)
- [Author](#author)

---

## Project Overview

FitTrack is designed to help users manage their fitness journey through a web-based platform. Clients can register, browse trainers, subscribe to trainers, receive workout and meal plans, track progress, and use the goal prediction feature. Trainers can manage their profiles, accept client requests, assign workout and meal plans, and monitor client progress. Administrators can verify trainers, manage users, and monitor subscriptions and payments.

The system follows a full-stack architecture with a React frontend, Spring Boot backend, MySQL database, and a Python Flask machine learning service.

---

## Main Features

### Client Features

- Client registration and login
- Profile creation and management
- Trainer browsing and filtering
- Trainer recommendation using backend logic
- Trainer subscription request
- Stripe sandbox payment testing
- View assigned workout plans
- View assigned meal plans
- Track fitness progress
- Use goal prediction feature

### Trainer Features

- Trainer registration and login
- Trainer profile management
- Upload trainer profile photo
- Add specialization, bio, certifications, and pricing
- Set weekly availability
- View client subscription requests
- Accept or reject client requests
- Assign workout plans
- Assign meal plans
- Monitor client progress

### Admin Features

- Admin login
- Admin dashboard
- View recent users
- Manage clients and trainers
- Verify trainer accounts
- Approve or reject trainer applications
- View platform analytics
- Monitor subscription payments
- Manage user information

### Machine Learning Feature

- Goal prediction feature using machine learning
- Predicts estimated time or guidance based on user fitness-related inputs
- Integrated with the backend and frontend through a Python Flask ML service

---

## Technologies Used

### Frontend

- React.js
- Vite
- Tailwind CSS
- Axios
- React Router
- Recharts
- SweetAlert2

### Backend

- Java 17
- Spring Boot
- Spring Security
- JWT Authentication
- BCrypt Password Encoding
- Spring Data JPA
- REST APIs

### Database

- MySQL 8.0
- MySQL Workbench

### Machine Learning Service

- Python
- Flask
- Scikit-learn
- Pandas
- NumPy

### Payment Integration

- Stripe Sandbox
- Stripe test API keys
- Stripe test card payments

### Other Tools

- Docker
- Docker Compose
- Postman
- GitHub
- GitHub Actions

---

## System Requirements

Before running the system, install the following software:

- Java Development Kit 17 or later
- Node.js 18.x or later
- npm
- MySQL Server 8.0
- Python 3.11 or later
- Docker and Docker Compose, only required for Docker setup
- Git
- Visual Studio Code or IntelliJ IDEA

---

## Manual Installation and Setup

### 1. Clone the Repository


git clone https://github.com/Vihanga19105/fittrack-fyp.git
cd fittrack-fyp
```

---

### 2. Database Setup

Open MySQL Workbench and create a database named:

```sql
CREATE DATABASE fittrack_db;
```

Then import or run the SQL schema file provided in the `database` folder.

Example:

```text
/database/fittrack_backup.sql
```

Make sure the database name matches the database name used in the backend `application.properties` file.

---

### 3. Backend Setup

Navigate to the backend folder:


cd backend
```

Open the following file:

```text
src/main/resources/application.properties
```

Update the database username and password according to your local MySQL setup:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fittrack_db
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

Also add your required environment-related configuration such as JWT secret, Stripe test key, and mail configuration.

Do not commit real secret keys or passwords to GitHub.

Run the backend:

For Windows:


mvnw.cmd spring-boot:run
```

For Mac or Linux:


./mvnw spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

---

### 4. Machine Learning Service Setup

Open a new terminal and navigate to the ML service folder:


cd ml-service
```

Install the Python dependencies:


pip install -r requirements.txt
```

Run the ML service:


python app.py
```

The ML service runs on:

```text
http://localhost:5001
```

---

### 5. Frontend Setup

Open another terminal and navigate to the frontend folder:


cd frontend
```

Install the frontend dependencies:


npm install
```

Run the frontend:


npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the browser and go to:

```text
http://localhost:5173
```

---

## Docker Setup

Docker setup can be used to run the frontend, backend, database, and ML service together.

### 1. Start Docker

Open Docker Desktop and make sure Docker Engine is running.

### 2. Run Docker Compose

From the main project folder, run:


docker-compose up --build
```

This starts the following services automatically:

- Frontend
- Backend
- MySQL database
- ML service

Open the system in the browser:

```text
http://localhost:5173
```

To stop the containers, press:

```text
CTRL + C
```

or run:


docker-compose down
```

---

## Demo Accounts

Use the following demo accounts for testing and demonstration.

| Role    | Email           | Password          |
|---------|-----------------|-------------------|
| Admin   | admin@test.com  | add-demo-password |
| Trainer | trainer@test.com| add-demo-password |
| Client  | client@test.com | add-demo-password |


## Stripe Sandbox Testing

The payment module uses Stripe sandbox mode for testing. No real money is processed.

Use Stripe test card details for testing payments:

```text
Card Number: 4242 4242 4242 4242
Expiry Date: Any future date
CVC: Any 3 digits
ZIP/Postcode: Any value
```

The system validates the payment workflow and updates the subscription status after successful payment.

---

## Testing

The system was tested using the following testing methods:

- Unit testing
- Integration testing using Postman
- Security testing
- User Acceptance Testing
- Stripe sandbox payment testing
- Responsive UI testing

Main tested areas include:

- User registration and login
- JWT authentication
- Role-based access control
- Trainer profile management
- Trainer verification
- Trainer discovery
- Subscription payment workflow
- Workout plan assignment
- Meal plan assignment
- Goal prediction API integration
- Admin user management
- Payment monitoring

---

## Security Features

The system includes the following security-related features:

- JWT-based authentication
- Role-based access control
- BCrypt password hashing
- Protected API endpoints
- CORS configuration for frontend-backend communication
- Stripe sandbox for safe payment testing

---

## Project Folder Structure

```text
fittrack-fyp/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw.cmd
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── ml-service/
│   ├── app.py
│   ├── requirements.txt
│   └── model files
│
├── database/
│   └── fittrack_backup.sql
│
├── docker-compose.yml
└── README.md
```

---





## Common Local URLs

| Service    | URL                   |
|------------|----- -----------------|
| Frontend   | http://localhost:5173 |
| Backend    | http://localhost:8080 |
| ML Service | http://localhost:5001 |
| MySQL      | localhost:3306        |

---

## Author

Developed as a Final Year Project for the Software Engineering degree programme.

Project Name: FitTrack  
Project Type: Full-Stack Fitness Management Platform  