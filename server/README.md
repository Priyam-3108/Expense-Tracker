# Expense Tracker Backend API

A robust Node.js/Express backend for the Expense Tracker application with JWT authentication, MongoDB database, and comprehensive expense management features.

## 🚀 Features

- **User Authentication**: JWT-based registration and login
- **Expense Management**: Full CRUD operations for expenses
- **Category Management**: Create, edit, and delete expense categories
- **Analytics**: Expense statistics and trends
- **Security**: Password hashing, input validation, CORS protection
- **Multi-user Support**: Each user has their own isolated data

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### Category Endpoints

#### Get All Categories
```
GET /api/categories
Authorization: Bearer <token>
```

#### Create Category
```
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Food",
  "color": "#FF6B6B",
  "icon": "🍕"
}
```

#### Update Category
```
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Groceries",
  "color": "#4ECDC4"
}
```

#### Delete Category
```
DELETE /api/categories/:id
Authorization: Bearer <token>
```

### Expense Endpoints

#### Get All Expenses (with filtering)
```
GET /api/expenses?page=1&limit=10&category=categoryId&type=expense&startDate=2024-01-01&endDate=2024-12-31&search=groceries
Authorization: Bearer <token>
```

#### Create Expense
```
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

#### Update Expense
```
PUT /api/expenses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description",
  "amount": 90.00
}
```

#### Delete Expense
```
DELETE /api/expenses/:id
Authorization: Bearer <token>
```

#### Get Expense Statistics
```
GET /api/expenses/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Expense Trends
```
GET /api/expenses/trends?year=2024
Authorization: Bearer <token>
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

- **Password Hashing**: Using bcrypt with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation for all inputs
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers middleware
- **Rate Limiting**: Built-in protection against abuse
- **Data Isolation**: Users can only access their own data

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Production Deployment

1. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGO_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   CORS_ORIGIN=your-frontend-domain
   ```

2. **Build and start**
   ```bash
   npm start
   ```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
