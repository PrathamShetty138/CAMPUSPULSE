# CampusPulse — AI-Powered Student Feedback Analytics

A full-stack student feedback system built as an IWP (Internet and Web Programming) mini project. Students submit course feedback which is automatically classified using a rule-based sentiment engine, and administrators can view real-time analytics, inspect the database, and export reports.

---

## Features

### Student Portal
- **Sign Up / Sign In** — Register with name, USN, email, and password; credentials securely stored with bcrypt hashing
- **Submit Feedback** — Rate a course (1–5 stars), select subject and faculty, answer a 6-question evaluation questionnaire, and write detailed comments
- **Auto Sentiment Analysis** — Feedback text is classified as Positive, Neutral, or Negative using a weighted keyword engine with negation handling and intensifier support
- **My Submissions** — View all past submissions with sentiment badges, ratings, and filter by category or sentiment
- **Profile Management** — Update name, change password, or delete account

### Admin Dashboard
- **Secure Login** — Admin credentials verified server-side (`admin` / `admin123`)
- **Analytics Overview** — Total feedback count, positive/neutral/negative counts with percentages, and average star rating
- **Charts** — Donut chart for sentiment distribution, bar charts for rating distribution and category breakdown, and a faculty-wise performance grid
- **AI-Inspired Insights** — Automated recommendations flagged by priority (high / medium / low) based on sentiment trends, subject scores, and category patterns
- **Filter & View** — Filter recent feedback list by sentiment
- **Export CSV** — Download all feedback data as a CSV report via the server
- **DB Viewer** — Live admin page showing every row in the database with search, sort, and filter

---

## File Structure

```
IWP-MINI-PROJECT/
├── server.js                 # Express backend — all API routes + SQLite setup
├── api.js                    # Shared fetch helper used by all HTML pages
├── package.json              # Node.js dependencies
├── campuspulse.db            # SQLite database (auto-created on first run)
│
├── index.html                # Landing page (hero, features, role selector)
├── student-signup.html       # Student registration form
├── student-signin.html       # Student login form
├── home.html                 # Student dashboard (submit / history / profile cards)
├── feedback.html             # Feedback submission form with questionnaire
├── history.html              # Student's past submissions with filters
├── profile.html              # Profile editor and account actions
├── admin-login.html          # Admin login form
├── dashboard.html            # Admin analytics dashboard
├── db-viewer.html            # Admin DB viewer (live table browser)
│
└── styles.css                # Shared stylesheet (dark theme)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom, no framework) |
| Frontend Logic | Vanilla JavaScript (ES6+) |
| Backend | Node.js + Express |
| Database | SQLite (via sql.js — pure JS, no native build needed) |
| Authentication | Server-side sessions (express-session) + bcrypt password hashing |
| Charts | HTML5 Canvas API (custom donut chart) |

---

## How to Run

**Prerequisites:** Node.js (v18 or newer)

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js
```

Then open **http://localhost:3000** in your browser.

The SQLite database file (`campuspulse.db`) is created automatically on first run. No setup required.

---

## API Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/signup` | Public | Register a new student |
| POST | `/api/signin` | Public | Student login |
| POST | `/api/admin/login` | Public | Admin login |
| POST | `/api/logout` | Any | Destroy session |
| GET | `/api/me` | Any | Get current session user |
| GET | `/api/profile` | Student | Get profile + stats |
| PUT | `/api/profile` | Student | Update name / password |
| DELETE | `/api/profile` | Student | Delete account + feedbacks |
| POST | `/api/feedbacks` | Student | Submit feedback |
| GET | `/api/feedbacks/my` | Student | Get own submissions |
| GET | `/api/admin/feedbacks` | Admin | Get all feedbacks |
| DELETE | `/api/admin/feedbacks/:id` | Admin | Delete a feedback |
| GET | `/api/admin/db-stats` | Admin | Full DB stats + all records |
| GET | `/api/admin/export` | Admin | Download all data as CSV |

---

## Demo Credentials

| Role | Username / Email | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | Register via Sign Up | Your chosen password |

---

## Database Schema

**`students` table**
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key, auto-increment |
| name | TEXT | Full name |
| usn | TEXT | University Seat Number (unique) |
| email | TEXT | Unique |
| password | TEXT | bcrypt hashed |
| created_at | TEXT | ISO datetime |

**`feedbacks` table**
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key, auto-increment |
| student_id | INTEGER | Foreign key → students.id |
| student_name | TEXT | |
| student_email | TEXT | |
| usn | TEXT | |
| subject_name | TEXT | |
| faculty_name | TEXT | |
| rating | INTEGER | 1–5 |
| category | TEXT | Auto-tagged from questionnaire |
| feedback | TEXT | Detailed text |
| q1 – q6 | TEXT | Questionnaire answers (Excellent/Good/Average/Poor) |
| sentiment | TEXT | positive / neutral / negative |
| sentiment_score | INTEGER | Confidence 0–100 |
| timestamp | TEXT | ISO datetime |

---

## Sentiment Analysis Engine

Implemented in `feedback.html` (client-side, runs before submission):

- **Weighted keyword dictionaries** — positive and negative words carry a score of 1, 2, or 3
- **Negation detection** — words like *not*, *never*, *don't* within a 3-word window flip the sentiment of the following keyword
- **Intensifiers** — words like *very*, *extremely*, *absolutely* multiply the keyword score (1.3× to 2×)
- **Rating bias** — the numeric star rating contributes heavily to the final score
- **Classification thresholds** — combined score determines Positive / Neutral / Negative with a confidence percentage

---

## Project Info

- **Course:** Internet and Web Programming (IWP)
- **Type:** Mini Project
- **Year:** 2026
