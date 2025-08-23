# 💰 Expense Tracker - MERN Stack Application

A comprehensive expense tracking application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication, expense management, category organization, and analytics visualization.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT-based authentication** with secure token management
- **User registration and login** with form validation
- **Password hashing** using bcrypt
- **Protected routes** with automatic token refresh
- **Multi-user support** with data isolation

### 💳 Expense Management
- **Add, edit, and delete expenses** with detailed information
- **Income tracking** alongside expenses
- **Category-based organization** with custom colors and icons
- **Date-based filtering** and search functionality
- **Recurring expense support** (weekly, monthly, yearly)
- **Tags and notes** for better organization

### 📊 Analytics & Visualization
- **Dashboard overview** with key metrics
- **Monthly expense trends** with interactive charts
- **Category-wise breakdown** with pie charts
- **Income vs Expense analysis**
- **Date range filtering** for custom reports

### 🎨 Modern UI/UX
- **Responsive design** that works on all devices
- **Dark/Light theme support** (coming soon)
- **Real-time notifications** with toast messages
- **Smooth animations** and transitions
- **Intuitive navigation** with sidebar layout

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **Recharts** - Chart library
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
expense-tracker/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Database & environment config
│   │   │   ├── db.js       # MongoDB connection
│   │   │   ├── env.js      # Environment variables
│   │   │   └── models/     # Mongoose schemas
│   │   │       ├── User.js
│   │   │       ├── Category.js
│   │   │       └── Expense.js
│   │   ├── controllers/    # Route handlers
│   │   │   ├── authController.js
│   │   │   ├── categoryController.js
│   │   │   └── expenseController.js
│   │   ├── middleware/     # Custom middleware
│   │   │   ├── auth.js     # JWT authentication
│   │   │   └── validation.js # Input validation
│   │   ├── routes/         # API routes
│   │   │   ├── auth.js
│   │   │   ├── categories.js
│   │   │   └── expenses.js
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── package.json
│   └── env.example
└── client/                 # Frontend (React + Vite)
    ├── src/
    │   ├── components/     # Reusable UI components
    │   │   └── Layout.jsx
    │   ├── pages/          # Page components
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Expenses.jsx
    │   │   ├── Categories.jsx
    │   │   ├── Analytics.jsx
    │   │   └── Profile.jsx
    │   ├── context/        # React Context
    │   │   ├── AuthContext.jsx
    │   │   └── ExpenseContext.jsx
    │   ├── services/       # API services
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── expenseService.js
    │   │   └── categoryService.js
    │   ├── utils/          # Helper functions
    │   │   ├── helpers.js
    │   │   └── cn.js
    │   ├── App.jsx         # Main app component
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Global styles
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd expense-tracker
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
```

Edit `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd ../client

# Install dependencies
npm install
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
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

### Category Endpoints

#### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Food",
  "color": "#FF6B6B",
  "icon": "🍕"
}
```

### Expense Endpoints

#### Get All Expenses
```http
GET /api/expenses?page=1&limit=10&category=categoryId&type=expense
Authorization: Bearer <token>
```

#### Create Expense
```http
POST /api/expenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Grocery shopping",
  "amount": 85.50,
  "date": "2024-01-15T10:30:00Z",
  "category": "categoryId",
  "type": "expense",
  "tags": ["food", "weekly"],
  "notes": "Weekly grocery shopping"
}
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String,
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Category Model
```javascript
{
  name: String (required),
  color: String (hex color),
  icon: String (emoji),
  user: ObjectId (ref: User),
  isDefault: Boolean,
  timestamps: true
}
```

### Expense Model
```javascript
{
  description: String (required),
  amount: Number (required),
  date: Date (required),
  category: ObjectId (ref: Category),
  user: ObjectId (ref: User),
  type: String (enum: ['expense', 'income']),
  tags: [String],
  notes: String,
  isRecurring: Boolean,
  recurringPeriod: String (enum: ['weekly', 'monthly', 'yearly']),
  timestamps: true
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers middleware
- **Data Isolation**: Users can only access their own data
- **Rate Limiting**: Built-in protection against abuse

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Set environment variables
2. Connect MongoDB database
3. Deploy using Git integration

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy using Git integration
3. Set environment variables for API URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MongoDB** for the database
- **Express.js** for the web framework
- **React** for the UI library
- **Tailwind CSS** for styling
- **Vite** for the build tool
- **Recharts** for data visualization

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Happy Expense Tracking! 💰📊**
