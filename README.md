# 🎓 SkillSwap Campus

> **Peer-to-Peer Study & Skill Exchange Platform for University Students**

SkillSwap Campus is a fullstack web application designed for students to connect, teach each other skills, collaborate in real-time workspaces, and schedule study sessions with automated Google Calendar and video meeting integration.

---

## 🌟 Key Features

### 🤝 1. Peer Skill Matching & Discovery
* **Mutual Skill Matching**: Browse student profiles filtered by what they teach and what they want to learn.
* **Speed Match Radar**: Smart matching score based on complementary skills.
* **Category Filters**: Filter peers by Tech & Coding, UI/UX Design, Data Science, Languages, Academic Subjects, and Creative Arts.
* **Exchange Request Workflow**: Send, accept, or decline study exchange proposals.

### 🔐 2. Authentication & Email Verification
* **Social Authentication**: 1-click Sign In and Sign Up with **Google** and **Facebook** powered by Better Auth.
* **Mandatory 6-Digit Email OTP**: Automated email verification for new account registrations.
* **Dual Sign-In Modes**: Choose between traditional password login or passwordless 6-digit email OTP sign-in.
* **Branded SMTP Delivery**: Outbound emails sent via Gmail SMTP (`smtp.gmail.com`) with secure TLS.

### 💬 3. Real-Time Study Room & Collaboration
* **Direct Peer Messaging**: Real-time communication with automatic message polling.
* **AI Swap Roadmap Generator**: Generates a 3-session syllabus with tailored milestones, study goals, and deliverables.
* **Collaborative Live Scratchpad**: Shared note-taking area with debounced auto-saving to MongoDB.
* **Code Snippet Sharing**: Share formatted code snippets with 1-click clipboard copying.

### 📅 4. Meeting Scheduling & Calendar Integration
* **Campus & Virtual Spots**: Schedule sessions at campus spots (Library 2nd Floor, Student Union Cafe, Quad, Tech Lab) or Virtual Video Rooms.
* **Unified Google Meet Rooms**: Automatically creates consistent Google Meet room links for video study sessions.
* **Automatic Google Calendar Sync**: Sends RFC 5545 compliant `.ics` calendar invites (`METHOD: REQUEST`) directly to both attendee and organizer. Gmail and Google Calendar automatically place the session onto participants' Google Calendars.
* **1-Click Google Calendar Action**: Instant link to view or modify events in Google Calendar.

---

## 🛠️ Technology Stack

| Area | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React, React Router v7 |
| **Backend** | Node.js, Express 5, MongoDB / Mongoose 9 |
| **Authentication** | Better Auth (MongoDB Adapter, Email OTP Plugin, Social Providers) |
| **Email Service** | Nodemailer (Gmail SMTP TLS 465), iCalendar RFC 5545 Generator |
| **Styling & Icons** | Tailwind CSS v4, Lucide React |

---

## 📁 Repository Structure

```text
skillswap-campus/
├── client/                          # React + Vite Frontend
│   ├── src/
│   │   ├── components/              # UI components (ChatModal, SchedulerModal, SocialAuth, etc.)
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── hooks/                   # Custom React hooks (useRequests, useStudents, useTheme)
│   │   ├── layouts/                 # MainLayout & AuthLayout
│   │   ├── lib/                     # Better Auth client configuration
│   │   ├── pages/                   # Views (Home, BrowseStudents, SignIn, SignUp, MyRequests)
│   │   ├── services/                # API client services (chatService, meetingService, etc.)
│   │   └── utils/                   # Calendar export, match scoring, roadmap generator
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express + MongoDB Backend
│   ├── src/
│   │   ├── controllers/             # Express controllers (auth, chat, meetings, students)
│   │   ├── models/                  # Mongoose schemas (Student, ExchangeRequest, Message, Meeting)
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # Email service & Nodemailer transporter
│   │   ├── auth.js                  # Better Auth configuration
│   │   ├── app.js                   # Express app setup & middleware
│   │   └── server.js                # Server entrypoint
│   ├── .env.example                 # Environment variables template
│   └── package.json
│
├── .gitignore                       # Root git ignore (protects .env and credentials)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: A local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
* **npm**: v9.0.0 or higher

---

### 1. Clone the Repository
```bash
git clone https://github.com/rohankatira/skillswap-campus.git
cd skillswap-campus
```

---

### 2. Backend Setup (`server`)

1. Navigate to the `server` directory:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `server/.env`:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/skillswap?retryWrites=true&w=majority

   # Server URLs
   PORT=5000
   BETTER_AUTH_URL=http://localhost:5000
   CLIENT_ORIGIN=http://localhost:5173

   # Auth Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   BETTER_AUTH_SECRET=your_32_byte_secret_here

   # Email Service (Gmail SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-google-app-password
   SMTP_FROM="SkillSwap Campus" <your-email@gmail.com>

   # Social OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_CLIENT_ID=your-facebook-app-id
   FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Backend will run on [http://localhost:5000](http://localhost:5000)*.

---

### 3. Frontend Setup (`client`)

1. Open a new terminal and navigate to `client`:
   ```bash
   cd client
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend will run on [http://localhost:5173](http://localhost:5173)*.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | **Yes** | Connection string for MongoDB database | `mongodb+srv://...` |
| `BETTER_AUTH_SECRET` | **Yes** | Secret encryption key for user sessions | `a3f89...` (32-byte hex) |
| `BETTER_AUTH_URL` | **Yes** | Base URL where backend API is hosted | `http://localhost:5000` |
| `CLIENT_ORIGIN` | **Yes** | URL of the frontend React application | `http://localhost:5173` |
| `PORT` | No | Port for Express server (default `5000`) | `5000` |
| `SMTP_HOST` | No | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port (465 for SSL, 587 for TLS) | `465` |
| `SMTP_USER` | No | Sending email address | `skillswapcampus01@gmail.com` |
| `SMTP_PASS` | No | Google App Password (16 characters) | `kcszkveuluuoyytu` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth 2.0 Web Client ID | `532312...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth 2.0 Client Secret | `GOCSPX-...` |
| `FACEBOOK_CLIENT_ID` | No | Facebook App ID | `1123859793709393` |
| `FACEBOOK_CLIENT_SECRET` | No | Facebook App Secret | `7186e67...` |

> **Note:** If `SMTP_USER` and `SMTP_PASS` are left empty, the application automatically uses an ephemeral **Ethereal test account** for development, logging email preview URLs to the console.

---

## 🧪 Testing & Code Quality

Run tests and linting from the respective directories:

```bash
# Frontend Linting
cd client
npm run lint

# Frontend Production Build Check
cd client
npm run build

# Backend Syntax Validation
cd server
node -c src/server.js src/controllers/*.js src/services/*.js
```

---

## 🔒 Security Best Practices

1. **`.env` Protection**: Real secrets and credentials must **never** be committed to Git. The repository includes a root [.gitignore](file:///.gitignore) that prevents `.env` leaks.
2. **Push Protection**: Verified with GitHub Secret Scanning to prevent credential exposure.
3. **Session Cookies & CORS**: Safe cross-origin requests between `localhost:5173` and `localhost:5000` with MongoDB-backed OAuth state verification.
4. **App Passwords**: Uses Google App Passwords instead of personal account passwords for SMTP email delivery.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
