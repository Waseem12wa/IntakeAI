# MongoDB Setup Guide

## 1. Install MongoDB

### On Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a service automatically

### On macOS:
```bash
brew install mongodb-community
brew services start mongodb-community
```

### On Linux (Ubuntu):
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## 2. Create Environment File

Create a `.env` file in the backend directory with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/intakeai

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=your_super_secret_jwt_key_here

# OpenAI API Key (if using AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

## 3. Start MongoDB

### Windows:
MongoDB should start automatically as a service. If not:
```cmd
net start MongoDB
```

### macOS/Linux:
```bash
sudo systemctl start mongodb
# or
brew services start mongodb-community
```

## 4. Verify MongoDB Connection

You can verify MongoDB is running by:
1. Opening MongoDB Compass (GUI tool)
2. Connecting to: `mongodb://localhost:27017`
3. You should see the `intakeai` database created automatically

## 5. Start Your Backend Server

```bash
cd backend
npm install
npm start
```

You should see: "MongoDB connected" in the console.

## 6. Database Collections

The following collections will be created automatically:
- `users` - User accounts
- `employeeprofiles` - Employee profiles
- `employerprofiles` - Employer/Company profiles
- `jobs` - Job postings
- `submissions` - Form submissions

## 7. API Endpoints

### Profile Management:
- `POST /api/profiles/employee` - Create employee profile
- `GET /api/profiles/employee` - Get employee profile
- `PUT /api/profiles/employee` - Update employee profile
- `POST /api/profiles/employer` - Create employer profile
- `GET /api/profiles/employer` - Get employer profile
- `PUT /api/profiles/employer` - Update employer profile

### Job Management:
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get specific job
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/employer/jobs` - Get employer's jobs
- `GET /api/jobs/employee/applications` - Get employee's applications

## 8. Troubleshooting

### MongoDB Connection Issues:
1. Check if MongoDB is running: `sudo systemctl status mongodb`
2. Check if port 27017 is available: `netstat -an | grep 27017`
3. Verify connection string in `.env` file
4. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

### Common Issues:
- **EADDRINUSE**: Port 5000 is already in use. Change PORT in .env
- **ECONNREFUSED**: MongoDB is not running
- **Authentication failed**: Check JWT_SECRET in .env

## 9. Production Setup

For production, consider:
1. Using MongoDB Atlas (cloud database)
2. Setting up proper authentication
3. Using environment-specific .env files
4. Setting up database backups
5. Configuring proper CORS settings
