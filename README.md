# ExpenseTracker - Financial Management & Anomaly Detection System



A production-grade, full-stack personal finance and expense tracking application built on the **MERN** stack, augmented with a high-performance **C++ Statistical Anomaly Detection Engine** and a **Java Budget Auditor**.


## 🚀 Live Demo

 
 [Live Project Demo](https://expanse-tracker-1-wqic.onrender.com)

---

## Architecture Overview

```
                      +-----------------------------+
                      | React SPA (Vite + Tailwind) |
                      |    - Interactive Dashboard  |
                      |    - In-App Notifications   |
                      |    - Recharts Cashflow View |
                      +--------------+--------------+
                                     |  REST (JSON / JWT)
                                     v
                      +-----------------------------+
                      |  Express.js API (Node.js)   |
                      |    - Auth & Security (JWT)  |
                      |    - Transactions CRUD      |
                      |    - Budget & Alert Engine  |
                      +-------+-------------+-------+
                              |             |
           +------------------+             +------------------+
           | (IPC stream)                                      | (IPC stream)
           v                                                   v
+--------------------------+                        +--------------------------+
|  C++ Analytics Engine    |                        |   Java Budget Auditor    |
|   - Outlier Detection    |                        |   - Spending Velocity    |
|   - Z-score Distribution |                        |   - Savings Projection   |
+--------------------------+                        +--------------------------+
           |                                                   |
           +-----------------> [ MongoDB / DB Adapter ] <------+
```

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts (Area & Donut Visualizations), Lucide React, Axios.
- **Backend API**: Node.js, Express.js, Mongoose / MongoDB, JSON Web Tokens (JWT), Bcrypt.js.
- **Statistical Analytics Engine**: C++14 (Statistical variance & Z-score distribution analysis).
- **Portfolio Auditor**: Java 17+ (Savings rate health rating & budget forecasting).

---

## Key Features

1. **Transaction & Cash Flow Management**:
   - Record and categorize Income vs. Expenses (Title, Amount, Category, Date, Payment Mode, Notes).
   - Real-time search by keyword, category, and date filtering.
   - 1-click **CSV export** for audit and tax reporting.

2. **Smart Budgeting & In-App Notification Center**:
   - Monthly category budget limits with visual progress meters.
   - Real-time notification dispatch:
     - **Warning Alert**: Triggered when monthly category spend reaches 80%.
     - **Critical Alert**: Triggered when monthly category spend exceeds 100%.
     - **Activity Alerts**: Instant feedback on income/expense transactions.
   - Bell dropdown with live unread badge, "Mark all read", and "Clear history".

3. **High-Performance Analytics Modules**:
   - **C++ Anomaly Detector**: Flags unusual spending spikes (where \(Z \ge 1.75\)) compared to historical category averages.
   - **Java Budget Auditor**: Evaluates overall portfolio savings rate and generates financial health classifications (`HEALTHY`, `MODERATE`, `CRITICAL`).

4. **Reliability & Developer Ergonomics**:
   - Automatic fallback storage adapter: runs out of the box even without an active local MongoDB daemon, while seamlessly connecting to MongoDB Atlas when `MONGO_URI` is provided.
   - 1-Click Demo account login for instant evaluation.

---

## Project Structure

```
expense-tracker/
├── package.json              # Monorepo scripts (dev, build, compile)
├── .gitignore
├── README.md
├── server/                   # Express.js REST API
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── config/           # MongoDB connection & fallback storage adapter
│   │   ├── controllers/      # Auth, Transactions, Budgets, Notifications, Analytics
│   │   ├── middleware/       # JWT auth guard, centralized error handling
│   │   ├── models/           # Mongoose schemas (User, Transaction, Budget, Notification)
│   │   ├── routes/           # REST endpoints
│   │   ├── app.js            # Express middleware setup
│   │   └── server.js         # Entrypoint & graceful shutdown
├── client/                   # React 18 (Vite) Single Page App
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── api/              # Axios client with JWT interceptors
│       ├── components/       # Navbar, NotificationCenter, StatCard, Charts, Modals
│       ├── context/          # AuthContext & Session management
│       ├── pages/            # Dashboard, Transactions, Login, Register
│       └── utils/            # Formatters & CSV exporter
├── cpp-engine/               # C++ Statistical Anomaly Detection Engine
│   └── src/
│       └── anomaly_detector.cpp
└── java-auditor/             # Java Financial Health Auditor
    └── src/
        └── BudgetAuditor.java
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Git](https://git-scm.com/)
- *(Optional)* `g++` (MinGW / GCC) and `javac` for compiling native engines (pre-compiled binaries and internal JavaScript fallbacks are included).
- *(Optional)* [MongoDB](https://www.mongodb.com/) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/<your-username>/expense-tracker.git
cd expense-tracker

# Install root, backend, and frontend dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Environment Configuration

Copy the example environment file for the backend:

```bash
cp server/.env.example server/.env
```

Default `.env` values:
```ini
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=supersecret_expense_tracker_jwt_key_2026_dev
CLIENT_URL=http://localhost:5173
```
*(Note: If local MongoDB is offline, the app automatically switches to the built-in storage engine with zero configuration required).*

### 3. Native Engines Compilation (Optional)

To compile the C++ and Java modules:

```bash
npm run compile-engines
```

### 4. Running the Application

Run both backend and frontend concurrently in development mode:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated user | Yes |

### Transactions
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/transactions` | Query transactions (supports pagination, search, filters) | Yes |
| `POST` | `/api/transactions` | Record new transaction (evaluates budget limits) | Yes |
| `GET` | `/api/transactions/:id` | Fetch transaction details by ID | Yes |
| `PUT` | `/api/transactions/:id` | Update transaction record | Yes |
| `DELETE` | `/api/transactions/:id`| Remove transaction record | Yes |
| `GET` | `/api/transactions/stats/summary` | Aggregate metrics & monthly cash flow trends | Yes |
| `GET` | `/api/transactions/export/csv` | Download filtered transaction history as CSV | Yes |

### Budgets & Notifications
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/budgets` | Fetch monthly category budgets with % spent | Yes |
| `POST` | `/api/budgets` | Set or update monthly category budget limit | Yes |
| `DELETE` | `/api/budgets/:category` | Remove budget limit for category | Yes |
| `GET` | `/api/notifications` | Retrieve unread/read alert notifications | Yes |
| `PUT` | `/api/notifications/read-all` | Mark all alerts as read | Yes |
| `DELETE`| `/api/notifications` | Clear notification history | Yes |

### Analytics
| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/analytics/anomaly-detection` | Run C++ statistical outlier detection on expenses | Yes |
| `GET` | `/api/analytics/audit-report` | Run Java enterprise financial health audit | Yes |

---

## License

This project is licensed under the Himanshu Yadav 

