# SafePath Emergency Response Backend

A robust Node.js backend API for the SafePath emergency response mobile application, providing real-time emergency alerts, location tracking, and notification services.

## Features

- **User Authentication & Authorization** - JWT-based secure authentication
- **Emergency Alert System** - Real-time emergency notifications via SMS, Email, and Push notifications
- **Location Services** - GPS tracking and Google Maps integration
- **Emergency Contacts Management** - Manage and notify emergency contacts
- **Real-time Communication** - Socket.IO for live updates
- **Notification Services** - Multi-channel notifications (SMS, Email, Push)
- **Security** - Rate limiting, input validation, and secure headers

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Notifications**: 
  - SMS: Twilio
  - Email: Nodemailer
  - Push: Firebase Cloud Messaging
- **Location**: Google Maps API
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Express Validator & Joi

## Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- Google Maps API key
- Twilio account (for SMS)
- Firebase project (for push notifications)
- Email service credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safepath-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/safepath
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Email Service
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # SMS Service (Twilio)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Firebase (Push Notifications)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   
   # Google Maps API
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Create logs directory**
   ```bash
   mkdir logs
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

### Emergency Endpoints

#### Trigger Emergency Alert
```http
POST /api/emergency/trigger
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  },
  "type": "SOS",
  "description": "Need immediate help"
}
```

#### Update Emergency Status
```http
PUT /api/emergency/:id/status
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "Resolved"
}
```

#### Get Emergency History
```http
GET /api/emergency/history?page=1&limit=10
Authorization: Bearer <jwt-token>
```

### Emergency Contacts Endpoints

#### Get Emergency Contacts
```http
GET /api/contacts
Authorization: Bearer <jwt-token>
```

#### Add Emergency Contact
```http
POST /api/contacts
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+1987654321",
  "email": "jane@example.com",
  "relationship": "Spouse",
  "isPrimary": true,
  "notificationPreferences": {
    "sms": true,
    "email": true,
    "call": false
  }
}
```

#### Test Contact Notification
```http
POST /api/contacts/:id/test
Authorization: Bearer <jwt-token>
```

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  emergencyContacts: [ObjectId],
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    medicalConditions: [String]
  },
  settings: {
    notificationsEnabled: Boolean,
    locationEnabled: Boolean,
    emergencyModeEnabled: Boolean
  },
  deviceTokens: [{
    token: String,
    platform: String
  }],
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }
}
```

### Emergency Model
```javascript
{
  user: ObjectId,
  type: String,
  status: String,
  priority: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    accuracy: Number
  },
  description: String,
  contactsNotified: [{
    contact: ObjectId,
    notifiedAt: Date,
    method: String,
    status: String
  }],
  locationHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }]
}
```

## Real-time Events (Socket.IO)

### Client Events
- `join-user-room` - Join user's personal room
- `emergency-alert` - Broadcast emergency to contacts
- `location-update` - Update emergency location

### Server Events
- `emergency-notification` - Emergency alert received
- `location-updated` - Location update received
- `emergency-status-update` - Emergency status changed

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/safepath
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start src/server.js --name safepath-api
pm2 startup
pm2 save
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Validate all incoming data
- **CORS Protection** - Control cross-origin requests
- **Helmet Security** - Set security headers
- **Password Hashing** - Bcrypt with salt rounds
- **Environment Variables** - Secure configuration management

## Monitoring & Logging

- **Winston Logging** - Structured logging with different levels
- **Error Handling** - Centralized error handling middleware
- **Health Check** - `/health` endpoint for monitoring
- **Request Logging** - Morgan HTTP request logger

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.