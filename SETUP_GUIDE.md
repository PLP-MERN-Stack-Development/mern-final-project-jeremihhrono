# 🚀 Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js installed (v14+): `node --version`
- ✅ MongoDB installed and running: `mongod --version`
- ✅ npm installed: `npm --version`

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Configure Environment Variables

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your preferred text editor
nano .env
```

**Minimum Required Configuration:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/community-health-service
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:3000
```

### 4. Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

### 5. Run the Application

**Development Mode (Recommended for testing):**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The application will open automatically at http://localhost:3000

### 6. First Time Use

1. **Register as a healthcare worker**
   - Go to http://localhost:3000
   - Click "Register here"
   - Fill in your details
   - Choose your role (Doctor/Nurse/Community Worker)

2. **Login**
   - Use your registered email and password
   - You'll be redirected to the dashboard

3. **Register your first patient**
   - Click "Register New Patient"
   - Fill in patient details
   - Click "Register Patient"

4. **Test payment features**
   - Go to patient details
   - Click "Make Payment"
   - Try cash payment first (simplest)

## 🔧 Optional Integrations

### M-Pesa Integration (Optional)
If you want to enable M-Pesa payments:

1. Create Safaricom Developer Account: https://developer.safaricom.co.ke/
2. Create a test app
3. Get your credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode
   - Passkey
4. Add to .env file
5. For local testing, use ngrok: `ngrok http 5000`

### AI Features (Optional)
If you want to enable AI features:

1. Create OpenAI Account: https://platform.openai.com/
2. Get API key
3. Add to .env: `OPENAI_API_KEY=your_key_here`

## 📱 Testing the Application

### Test User Creation
```json
{
  "name": "Dr. John Doe",
  "email": "doctor@test.com",
  "password": "123456",
  "role": "doctor",
  "phoneNumber": "0712345678",
  "licenseNumber": "DOC12345",
  "specialization": "General Practitioner"
}
```

### Test Patient Registration
```json
{
  "name": "Jane Smith",
  "age": 35,
  "gender": "female",
  "phoneNumber": "0723456789",
  "sickness": "Malaria",
  "symptoms": "fever, headache, chills",
  "insuranceProvider": "NSSF",
  "insuranceNumber": "NSSF123456"
}
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Package Installation Errors
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

### CORS Errors
- Ensure CLIENT_URL in .env matches your frontend URL
- Restart backend server after changing .env

## 📊 Checking Everything Works

1. **Backend Health Check:**
   - Visit: http://localhost:5000/api/health
   - Should see: `{"status":"OK","message":"Community Health Service API is running"}`

2. **Frontend Loading:**
   - Visit: http://localhost:3000
   - Should see login page

3. **Database Connection:**
   - Check backend terminal for: "✓ MongoDB Connected Successfully"

## 🎉 You're Ready!

The application is now running and ready to use. Start by:
1. Registering as a healthcare worker
2. Adding patients
3. Recording visits
4. Processing payments

For production deployment, refer to the main README.md file.

---

**Need Help?** Check the main README.md or open an issue.