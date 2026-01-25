# InterViewFlow AI

<div align="center">

**An Adaptive, Composable AI Interview Engine**

*Simulating real technical and behavioral interviews with hiring-grade evaluation reports*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**InterViewFlow AI** is not just a chatbot—it's an **AI Evaluation Engine** that simulates real technical and behavioral interviews. The system treats an interview as a **closed-loop reasoning pipeline**, dynamically adapting questions based on candidate performance and producing comprehensive, hiring-grade evaluation reports.

### Key Philosophy

- **Questions are probes**: Designed to test specific concepts
- **Answers are signals**: Multi-dimensional analysis reveals truth
- **Memory is intelligence**: Patterns emerge from structured history
- **Scores are diagnostics**: Meaningful metrics, not arbitrary numbers
- **Adaptation is control**: Real-time strategy adjustment
- **Reports are decisions**: Hiring-grade evaluation documents

---

## ✨ Features

### 🎓 Adaptive Interview System
- **Dynamic Question Generation**: Questions adapt based on candidate performance
- **Difficulty Scaling**: Automatically adjusts difficulty (Junior → Mid-Level → Senior)
- **Skill-Based Probing**: Focuses on weak areas while reinforcing strengths
- **Context-Aware**: Maintains conversation context throughout the interview

### 📊 Comprehensive Evaluation
- **Multi-Dimensional Scoring**: Evaluates clarity, coherence, depth, communication, and overall performance
- **Real-Time Feedback**: Instant feedback after each answer
- **Performance Analytics**: Tracks trends, consistency, and improvement over time
- **Concept Mastery Mapping**: Identifies strong and weak areas per concept

### 🔐 Authentication & Security
- **Email/Password Authentication**: Secure local authentication with JWT
- **Google OAuth**: One-click sign-in with Google
- **Email Verification**: OTP-based email verification during registration
- **Password Reset**: Secure password reset via email
- **Account Management**: Update email and password in settings

### 📧 Email Services
- **OTP Verification**: Email verification during registration
- **Password Reset**: Secure password reset emails
- **Email Updates**: OTP verification for email changes

### 📄 Report Generation
- **Comprehensive Reports**: Detailed evaluation reports with scores and feedback
- **PDF Export**: Export reports as PDF documents
- **Share Functionality**: Share reports via Web Share API or clipboard
- **Performance Breakdown**: Skill-wise performance analysis
- **Coaching Recommendations**: Personalized improvement suggestions

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glass Morphism**: Beautiful glass-card design system
- **Smooth Animations**: Framer Motion animations throughout
- **Real-Time Updates**: Live score updates during interviews
- **Progress Tracking**: Visual pipeline showing interview stages

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, Passport.js (Google OAuth)
- **AI Integration**: GitHub Models API (Azure AI Inference)
- **Email**: Nodemailer
- **Security**: bcryptjs for password hashing

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Custom components with Radix UI primitives
- **PDF Generation**: jsPDF, html2canvas

### AI & LLM
- **Primary**: GitHub Models API (Azure AI Inference)
- **Model**: OpenAI GPT-4o (via GitHub Models)
- **Fallback**: Automatic model fallback for reliability

---

## 🏗 Architecture

### Interview Pipeline

```
Role → Context → Question Generation → Memory → Evaluation → Analytics → Adaptation → Final Report
```

### Core Components

1. **Interview State (Central Brain)**: Maintains cognitive state, performance trends, and mastery maps
2. **Question Generation Block**: Generates adaptive questions based on performance
3. **Evaluation Block**: Multi-dimensional answer analysis
4. **Memory Service**: Stores conversation history and patterns
5. **Analytics Block**: Computes performance metrics
6. **Adaptation Block**: Decides next strategy based on performance
7. **Coaching Block**: Generates personalized improvement plans
8. **Report Block**: Creates comprehensive evaluation reports

Each block operates independently but shares state through the central **Interview State** object.

For detailed architecture documentation, see [ARCHITECTURE.md](./interviewflow-backend/ARCHITECTURE.md).

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (MongoDB Atlas account recommended)
- **GitHub Account** (for GitHub Models API token)
- **Google Account** (for OAuth setup, optional)
- **Email Account** (Gmail recommended for SMTP)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd InterVirewFlow
```

### 2. Install Backend Dependencies

```bash
cd interviewflow-backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../interviewflow-frontend
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Create `.env` file** in `interviewflow-backend/`:

```env
# Server
PORT=5001
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=your-mongodb-connection-string

# JWT
JWT_SECRET=your-super-secret-jwt-key

# GitHub Models API (Azure AI Inference)
GITHUB_TOKEN=your-github-token-with-models-read-permission
GITHUB_MODEL=openai/gpt-4o

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

### Frontend Configuration

The frontend automatically connects to `http://localhost:5001` for API calls. No additional configuration needed.

### Setup Instructions

1. **MongoDB Atlas**:
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Get your connection string and add it to `.env`

2. **GitHub Models API**:
   - Create a GitHub Personal Access Token with `models:read` permission
   - See [GitHub Models Documentation](https://docs.github.com/en/copilot/github-models-api)
   - Add token to `.env` as `GITHUB_TOKEN`

3. **Gmail SMTP** (for email services):
   - Enable 2-Step Verification on your Google account
   - Generate an App Password at [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Use the App Password (not your regular password) in `.env`

4. **Google OAuth** (optional):
   - Follow instructions in [OAUTH_SETUP.md](./interviewflow-backend/OAUTH_SETUP.md)
   - Add credentials to `.env`

---

## 🎮 Usage

### Development Mode

1. **Start Backend Server**:

```bash
cd interviewflow-backend
npm run dev
```

The server will start on `http://localhost:5001`

2. **Start Frontend Development Server**:

```bash
cd interviewflow-frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

3. **Open in Browser**:

Navigate to `http://localhost:5173`

### Production Build

1. **Build Frontend**:

```bash
cd interviewflow-frontend
npm run build
```

2. **Start Backend**:

```bash
cd interviewflow-backend
npm start
```

---

## 📁 Project Structure

```
InterVirewFlow/
├── interviewflow-backend/          # Backend API
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   │   ├── db.js              # MongoDB connection
│   │   │   ├── github-models.js   # GitHub Models API config
│   │   │   └── passport.js        # OAuth strategies
│   │   ├── controllers/           # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   └── interview.controller.js
│   │   ├── models/                # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Interview.js
│   │   │   ├── Memory.js
│   │   │   ├── OTP.js
│   │   │   └── PasswordReset.js
│   │   ├── routes/                # Express routes
│   │   │   ├── auth.routes.js
│   │   │   └── interview.routes.js
│   │   ├── services/              # Business logic
│   │   │   ├── blocks/            # AI intelligence blocks
│   │   │   │   ├── question.block.js
│   │   │   │   ├── evaluation.block.js
│   │   │   │   ├── adaptation.block.js
│   │   │   │   ├── analytics.block.js
│   │   │   │   ├── coaching.block.js
│   │   │   │   └── report.block.js
│   │   │   ├── interview.js       # Interview orchestration
│   │   │   ├── memory.js          # Memory service
│   │   │   ├── report.js          # Report generation
│   │   │   └── email.service.js   # Email service
│   │   ├── middleware/            # Express middleware
│   │   │   └── auth.middleware.js
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # Server entry point
│   ├── .env                       # Environment variables
│   ├── package.json
│   └── ARCHITECTURE.md            # Architecture documentation
│
└── interviewflow-frontend/        # Frontend React app
    ├── src/
    │   ├── components/           # React components
    │   │   ├── flow/             # Interview flow components
    │   │   ├── shared/           # Shared components
    │   │   └── ui/               # UI primitives
    │   ├── pages/                # Page components
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Setup.jsx
    │   │   ├── Interview.jsx
    │   │   ├── Report.jsx
    │   │   ├── Settings.jsx
    │   │   ├── ForgotPassword.jsx
    │   │   └── ResetPassword.jsx
    │   ├── hooks/                # Custom React hooks
    │   │   └── useInterviewSession.js
    │   ├── layout/               # Layout components
    │   │   ├── AppShell.jsx
    │   │   └── Header.jsx
    │   ├── lib/                  # Utilities and contexts
    │   │   ├── AuthContext.jsx
    │   │   ├── api.js
    │   │   ├── constants.js
    │   │   └── utils.js
    │   ├── styles/               # Global styles
    │   │   └── globals.css
    │   └── App.jsx               # Main app component
    ├── package.json
    └── vite.config.js
```

---

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/send-otp` - Send OTP for email verification
- `POST /api/auth/verify-otp` - Verify OTP and register
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/send-email-update-otp` - Send OTP for email update
- `PUT /api/auth/update-email` - Update email (requires OTP)
- `PUT /api/auth/update-password` - Update password
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Interview

- `POST /api/interview/start` - Start new interview session
- `POST /api/interview/answer` - Submit answer and get next question
- `GET /api/interview/:id` - Get interview details
- `GET /api/interview/:id/report` - Get interview report

### Health & Diagnostics

- `GET /health` - Health check
- `GET /api/diagnostics` - API configuration diagnostics

---

## 🎯 Key Features Explained

### Adaptive Question Generation

Questions are generated based on:
- Current difficulty level
- Candidate's performance history
- Detected weak areas
- Experience level (Junior/Mid-Level/Senior)
- Previous questions asked

### Multi-Dimensional Evaluation

Each answer is evaluated across:
- **Relevance**: Does it address the question?
- **Correctness**: Are technical statements accurate?
- **Depth**: Understanding of internals vs surface knowledge
- **Clarity**: Coherent and well-structured explanation
- **Confidence**: Decisive vs vague responses

### Real-Time Adaptation

The system adapts in real-time:
- **If struggling**: Reduces difficulty, asks foundational questions
- **If excelling**: Increases difficulty, asks deeper questions
- **If inconsistent**: Focuses on weak areas
- **If improving**: Gradually increases challenge

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Express.js](https://expressjs.com/)
- AI powered by [GitHub Models API](https://docs.github.com/en/copilot/github-models-api)
- UI components inspired by modern design systems
- Icons by [Lucide](https://lucide.dev/)

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

<div align="center">

**Made with ❤️ for better interview experiences**

</div>
