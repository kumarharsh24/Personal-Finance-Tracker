# 💰 Personal Finance Tracker

A comprehensive, full-stack Personal Finance Tracker application designed to help users track their income, expenses, budgets, and investments. The platform features an intuitive dashboard, detailed reporting, secure authentication, and AI-powered financial insights.

## ✨ Features

- **Dashboard & Analytics**: Visual overview of your financial health, recent transactions, and budget statuses.
- **Transaction Management**: Easily add, edit, delete, and categorize income and expense transactions.
- **Budget Tracking**: Set monthly budgets for different categories and track your spending against them.
- **AI-Powered Insights**: Get personalized financial advice and anomaly detection using OpenAI integration.
- **Secure Authentication**: Traditional email/password login and Google OAuth integration.
- **Import & Export**: Support for bulk importing transactions via CSV and exporting data.
- **Email Notifications**: Receive automated alerts for budget thresholds or unusual spending (via SendGrid).
- **Responsive UI**: A modern, clean frontend built with HTML, CSS, and Vanilla JavaScript.

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Query Builder**: Knex.js
- **Authentication**: Passport.js (Local & Google OAuth 2.0), Express Session
- **File Uploads**: Multer (for receipt and CSV uploads)
- **External APIs**: OpenAI (Insights), SendGrid (Emails), Exchange Rate API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (API-driven)

---
Deoployment Link:-https://personal-finance-tracker-hls3.onrender.com/

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kumarharsh24/Personal-Finance-Tracker.git
   cd "Personal Finance Tracker"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure your credentials:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your database credentials and optional API keys (Google OAuth, SendGrid, OpenAI).

4. **Database Setup**
   Ensure your PostgreSQL server is running and create the database (default name: `finance_tracker`).
   ```bash
   createdb finance_tracker
   ```
   
   Run the Knex database migrations to create the required tables:
   ```bash
   npm run migrate
   ```
   
   *(Optional)* Run seeds to populate the database with initial data:
   ```bash
   npm run seed
   ```

### Running the Application

To start the server in development mode (with hot-reloading):
```bash
npm run dev
```

To start the server in production mode:
```bash
npm start
```

The application will be accessible at `http://localhost:3000`.

---

## 📁 Project Structure

```
.
├── migrations/         # Database migration files (schema definitions)
├── public/             # Static frontend files (HTML, CSS, JS)
├── src/
│   ├── config/         # Database and Passport configurations
│   ├── controllers/    # Request handlers for API endpoints
│   ├── middleware/     # Custom Express middlewares (Auth, Error handling, Uploads)
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic and external API integrations
│   ├── utils/          # Helper functions and validators
│   └── app.js          # Express app setup and middleware registration
├── uploads/            # Temporary directory for file uploads
├── .env.example        # Template for environment variables
├── knexfile.js         # Knex database configuration
├── package.json        # Project metadata and scripts
└── server.js           # Application entry point
```

---

## 🌍 Deployment (Render)

This project is fully configured to be deployed on [Render.com](https://render.com/).

1. Create a PostgreSQL database on Render.
2. Create a Web Service connected to this GitHub repository.
3. Add the following required Environment Variables in Render:
   - `NODE_ENV=production`
   - `DATABASE_URL` (Your Render PostgreSQL internal URL)
   - `SESSION_SECRET` (A secure random string)
4. The deployment script (`npm start`) will automatically run database migrations before starting the server.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/kumarharsh24/Personal-Finance-Tracker/issues).

## 📝 License

This project is licensed under the ISC License.
