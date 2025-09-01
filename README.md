# Care4U - Health & Wellness Mobile App

A comprehensive health and wellness mobile application built with React Native and Node.js, featuring OTP-based authentication, meal tracking, exercise monitoring, blood sugar management, appointment scheduling and comprehensive analytics.

## Features

### Authentication & User Management
- OTP-based authentication with email verification
- User profile management with health information
- Dietary preferences (vegetarian/non-vegetarian)

### Health Tracking
- Meal & Nutrition : Food database, meal recording, calorie tracking, meal templates
- Exercise & Activity : Activity logging, calorie burn tracking, exercise history
- Blood Sugar Management : Glucose level tracking with meal context
- Appointment Scheduling : Healthcare appointment management

### Analytics & Insights
- Health dashboard with progress tracking
- Daily, weekly, and monthly summaries
- Data visualization and goal monitoring

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- React Native Paper

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- TypeScript

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm
- Expo CLI
- PostgreSQL database
- Gmail account for SMTP

### Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd care4u-mobile-app
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   
   # Environment configuration
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   
   DATABASE_URL=your_postgresql_connection_string
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your_secure_jwt_secret
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   FROM_EMAIL=your_gmail@gmail.com
   FROM_NAME=Care4U App

   
   ```bash
   # Database setup
   npm run db:init
   
   # Start development server
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   
   # Configure API endpoint
   # Edit src/constants/config.ts and update API_BASE_URL
   
   # Start development server
   npx expo start
   ```

## Database Schema

### Core Tables
- users - User profiles and preferences
- otp_verification - OTP codes for authentication
- food_items - Food database with nutritional information
- meal_records - User meal tracking data
- meal_record_items - Individual food items in meal records
- meal_templates - Saved meal templates
- meal_template_items - Individual food items in meal templates
- exercise_activities - Exercise and activity data
- sugar_records - Blood glucose monitoring data
- appointments - Healthcare appointment scheduling
- meal_recommendations - Pre-defined meal suggestions

## Project Structure

```
care4u-mobile-app/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Configuration files (database, email)
│   │   ├── controllers/    # Request handlers
│   │   ├── database/       # Database initialization and schema
│   │   ├── middleware/     # Custom middleware (auth, validation)
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Main server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── env.example
│
├── frontend/               # React Native mobile app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── constants/      # App constants and theme
│   │   ├── contexts/       # React contexts (AppointmentContext)
│   │   ├── navigation/     # Navigation configuration
│   │   ├── screens/        # App screens (organized by feature)
│   │   │   ├── appointments/
│   │   │   ├── exercise/
│   │   │   ├── meal/
│   │   │   └── sugar/
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── App.tsx             # Main app component
│   ├── app.json            # Expo configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── babel.config.js
│
└── README.md               # Project documentation

```
## Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Development Tools
- [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design components
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript documentation
- [JWT.io](https://jwt.io/) - JWT token debugger and documentation

### Database & Backend
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Nodemailer](https://nodemailer.com/) - Email sending library




