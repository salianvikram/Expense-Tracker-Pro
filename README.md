# Expense Tracker Pro — Personal Finance Analytics Dashboard

A full-stack personal finance management application built with React, Node.js, Express, and MongoDB Atlas. Designed for portfolio showcasing and technical interviews.

## ✨ Features

- **JWT Authentication** — Register, login, logout with secure token-based sessions
- **Dashboard** — Balance, Income, Expenses, and Savings summary cards
- **Transaction Management** — Add, edit, delete transactions with categories
- **Analytics** — 6-month trend chart, income vs expenses bar chart, category doughnut chart
- **Filtering** — Filter by month, year, type (income/expense), and search by name
- **CSV Export** — Download filtered transactions as a CSV file
- **Responsive Design** — Works on mobile, tablet, and desktop

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 19, Vite 8, JavaScript        |
| Styling     | Vanilla CSS (custom design system)  |
| Charts      | Chart.js + react-chartjs-2          |
| Backend     | Node.js, Express 5                  |
| Database    | MongoDB Atlas + Mongoose            |
| Auth        | JWT + bcryptjs                      |
| HTTP Client | Axios                               |
| Deployment  | Vercel (frontend) + Render (backend)|

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- A MongoDB Atlas account (free tier works fine)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker-pro.git
cd expense-tracker-pro
```

---

### 2. Backend setup

```bash
cd server
npm install
```

Create the `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/expense-tracker-pro
JWT_SECRET=your_long_random_secret_here
NODE_ENV=development
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

Start the backend:

```bash
npm run dev
# Server running on http://localhost:5000
```

---

### 3. Frontend setup

```bash
cd ../client
npm install
```

Create `.env.local` inside `client/`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
# App running on http://localhost:5173
```

---

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) and register a new account.

---

## 🌐 Deployment

### Backend → Render

1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string
   - `NODE_ENV` — `production`
   - `CLIENT_URL` — your Vercel frontend URL (e.g. `https://expense-tracker-pro.vercel.app`)
6. Deploy — note your Render URL (e.g. `https://expense-tracker-api.onrender.com`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set:
   - **Root directory:** `client`
   - **Framework preset:** Vite
4. Add Environment Variable:
   - `VITE_API_URL` — your Render backend URL
5. Deploy

---

## 📁 Project Structure

```
expense-tracker-pro/
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── api/              # Axios instance
│   │   ├── components/       # ProtectedRoute
│   │   ├── context/          # AuthContext
│   │   ├── pages/            # LoginPage, RegisterPage
│   │   ├── App.jsx           # Main dashboard
│   │   ├── index.css         # Design system CSS
│   │   └── main.jsx          # App entry + routing
│   ├── index.html
│   └── vite.config.js
│
└── server/                   # Express backend
    ├── middleware/
    │   └── auth.js           # JWT protect middleware
    ├── models/
    │   ├── User.js           # Mongoose User schema
    │   └── Transaction.js    # Mongoose Transaction schema
    ├── routes/
    │   ├── auth.js           # Register / Login / Me
    │   └── transactions.js   # CRUD + summary
    ├── server.js             # Express app + DB connection
    └── .env                  # (not committed)
```

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 7 days
- All transaction routes enforce per-user data isolation
- `.env` files are excluded from version control
- Input validation on all endpoints
- CORS configured to only allow known frontend origins

## 📄 API Endpoints

| Method | Endpoint                       | Auth | Description              |
|--------|--------------------------------|------|--------------------------|
| POST   | `/api/auth/register`           | ❌   | Create account           |
| POST   | `/api/auth/login`              | ❌   | Sign in, get JWT         |
| GET    | `/api/auth/me`                 | ✅   | Get current user         |
| GET    | `/api/transactions`            | ✅   | List (with filters)      |
| POST   | `/api/transactions`            | ✅   | Create transaction       |
| PUT    | `/api/transactions/:id`        | ✅   | Edit transaction         |
| DELETE | `/api/transactions/:id`        | ✅   | Delete transaction       |
| GET    | `/api/transactions/summary`    | ✅   | Analytics summary        |

---

Built with ❤️ for Vikram's SDE portfolio.
