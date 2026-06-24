# IWP-MINI-PROJECT
# CampusPulse — AI-Powered Student Feedback Analytics

A browser-based student feedback system built as an IWP (Internet and Web Programming) mini project. Students submit course feedback which is automatically classified using a rule-based sentiment engine, and administrators can view real-time analytics and export reports.

---

## Features

### Student Portal
- **Sign Up / Sign In** — Register with name, USN, email, and password; credentials stored in localStorage
- **Submit Feedback** — Rate a course (1–5 stars), select subject and faculty, answer a 6-question evaluation questionnaire, and write detailed comments
- **Auto Sentiment Analysis** — Feedback text is classified as Positive, Neutral, or Negative using a weighted keyword engine with negation handling and intensifier support
- **My Submissions** — View all past submissions with sentiment badges, ratings, and filter by category or sentiment
- **Profile Management** — Update name, change password, or delete account

### Admin Dashboard
- **Secure Login** — Hardcoded admin credentials (`admin` / `admin123`)
- **Analytics Overview** — Total feedback count, positive/neutral/negative counts with percentages, and average star rating
- **Charts** — Donut chart for sentiment distribution, bar charts for rating distribution and category breakdown, and a faculty-wise performance grid
- **AI-Inspired Insights** — Automated recommendations flagged by priority (high / medium / low) based on sentiment trends, subject scores, and category patterns
- **Filter & View** — Filter recent feedback list by sentiment
- **Export CSV** — Download all feedback data or per-faculty data as a CSV report

---

## File Structure

```
IWP MINI PROJECT/
├── index.html            # Landing page (hero, features, how-it-works, role selector)
├── student-signup.html   # Student registration form
├── student-signin.html   # Student login form
├── home.html             # Student dashboard (submit / history / profile cards)
├── feedback.html         # Feedback submission form with questionnaire
├── history.html          # Student's past submissions with filters
├── profile.html          # Profile editor and account actions
├── admin-login.html      # Admin login form
├── dashboard.html        # Admin analytics dashboard
├── styles.css            # Shared stylesheet (dark theme)
├── localstorage-viewer.html  # Debug utility to inspect localStorage data
└── ppt.html              # Project presentation slide
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom, no framework) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | Browser localStorage |
| Charts | HTML5 Canvas API (custom donut chart) |

No backend, no database, no external libraries — fully client-side.

---

## How to Run

1. Clone or download the project folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
3. No build step or server required — just open the file directly.

---

## Demo Credentials

| Role | Username / Email | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | Register via Sign Up | Your chosen password |

---

## Sentiment Analysis Engine

The engine is implemented entirely in JavaScript inside `feedback.html`. It uses:

- **Weighted keyword dictionaries** — positive and negative words each carry a score of 1, 2, or 3
- **Negation detection** — words like *not*, *never*, *don't* within a 3-word window flip the sentiment of the following keyword
- **Intensifiers** — words like *very*, *extremely*, *absolutely* multiply the keyword score (1.3× to 2×)
- **Rating bias** — the numeric star rating contributes directly to the final score
- **Classification thresholds** — combined score determines Positive, Neutral, or Negative output with a confidence percentage

---

## Data Model (localStorage)

**`students`** — array of student objects
```json
{ "name": "...", "usn": "...", "email": "...", "password": "..." }
```

**`feedbacks`** — array of feedback objects
```json
{
  "studentName": "...", "studentEmail": "...", "usn": "...",
  "subjectName": "...", "facultyName": "...",
  "rating": 4, "category": "Teaching Methods",
  "feedback": "...", "sentiment": "positive", "sentimentScore": 12,
  "questionnaire": { "q1": "Excellent", "q2": "Good", ... },
  "timestamp": "2026-06-24T...", "id": 1719187200000
}
```

**`currentUser`** — the currently logged-in user (cleared on logout)

---

## Known Limitations

- All data is stored in the browser's localStorage — clearing browser data wipes everything
- Admin credentials are hardcoded in `admin-login.html` (not suitable for production)
- Passwords are stored in plain text in localStorage (acceptable for a demo project)
- No backend or server-side validation

---

## Project Info

- **Course:** Internet and Web Programming (IWP)
- **Type:** Mini Project
- **Year:** 2026
