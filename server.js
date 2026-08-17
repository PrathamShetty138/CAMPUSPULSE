'use strict';

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'campuspulse.db');

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // serve HTML files

app.use(session({
    secret: 'campuspulse-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

// ─── Database Setup ────────────────────────────────────────────────────────────
let db;

async function initDB() {
    const SQL = await initSqlJs();

    // Load existing DB file if present, otherwise start fresh
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('Loaded existing database from', DB_PATH);
    } else {
        db = new SQL.Database();
        console.log('Created new in-memory database');
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT    NOT NULL,
            usn       TEXT    NOT NULL UNIQUE,
            email     TEXT    NOT NULL UNIQUE,
            password  TEXT    NOT NULL,
            created_at TEXT   DEFAULT (datetime('now'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS feedbacks (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id      INTEGER NOT NULL,
            student_name    TEXT    NOT NULL,
            student_email   TEXT    NOT NULL,
            usn             TEXT    NOT NULL,
            subject_name    TEXT    NOT NULL,
            faculty_name    TEXT    NOT NULL,
            rating          INTEGER NOT NULL,
            category        TEXT    NOT NULL,
            feedback        TEXT    NOT NULL,
            q1              TEXT,
            q2              TEXT,
            q3              TEXT,
            q4              TEXT,
            q5              TEXT,
            q6              TEXT,
            sentiment       TEXT    NOT NULL DEFAULT 'neutral',
            sentiment_score INTEGER NOT NULL DEFAULT 50,
            timestamp       TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    `);

    persistDB();
    console.log('Database tables ready');
}

// Persist in-memory sql.js DB back to disk after every write
function persistDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ─── DB Helpers ────────────────────────────────────────────────────────────────
function dbGet(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

function dbAll(sql, params = []) {
    const results = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function dbRun(sql, params = []) {
    db.run(sql, params);
    persistDB();
    // Return last insert rowid
    const row = dbGet('SELECT last_insert_rowid() as id');
    return row ? row.id : null;
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────
function requireStudent(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'student') {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorised. Please login.' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorised. Admin access required.' });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// ---------- Student Sign Up ----------
app.post('/api/signup', async (req, res) => {
    try {
        const { name, usn, email, password } = req.body;

        if (!name || !usn || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const usnUpper = usn.toUpperCase();

        if (dbGet('SELECT id FROM students WHERE email = ?', [email])) {
            return res.status(409).json({ error: 'Email already registered. Please sign in.' });
        }
        if (dbGet('SELECT id FROM students WHERE usn = ?', [usnUpper])) {
            return res.status(409).json({ error: 'USN already registered. Please sign in.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const id = dbRun(
            'INSERT INTO students (name, usn, email, password) VALUES (?, ?, ?, ?)',
            [name, usnUpper, email, hashed]
        );

        req.session.user = { id, name, usn: usnUpper, email, role: 'student' };
        return res.json({ success: true, user: { id, name, usn: usnUpper, email, role: 'student' } });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ---------- Student Sign In ----------
app.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const student = dbGet('SELECT * FROM students WHERE email = ?', [email]);
        if (!student) {
            return res.status(401).json({ error: 'Invalid credentials. Please check your email or sign up.' });
        }

        const match = await bcrypt.compare(password, student.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials. Wrong password.' });
        }

        req.session.user = {
            id: student.id,
            name: student.name,
            usn: student.usn,
            email: student.email,
            role: 'student'
        };

        return res.json({ success: true, user: { id: student.id, name: student.name, usn: student.usn, email: student.email, role: 'student' } });
    } catch (err) {
        console.error('Signin error:', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ---------- Admin Login ----------
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Fixed admin credentials (can be moved to env vars later)
    if (username === 'admin' && password === 'admin123') {
        req.session.user = { name: 'Administrator', role: 'admin' };
        return res.json({ success: true, user: { name: 'Administrator', role: 'admin' } });
    }
    return res.status(401).json({ error: 'Invalid admin credentials.' });
});

// ---------- Logout ----------
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// ---------- Current Session ----------
app.get('/api/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ user: req.session.user });
    }
    return res.status(401).json({ error: 'Not logged in.' });
});

// ---------- Get Profile ----------
app.get('/api/profile', requireStudent, (req, res) => {
    const student = dbGet('SELECT id, name, usn, email, created_at FROM students WHERE id = ?', [req.session.user.id]);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const feedbacks = dbAll('SELECT rating, sentiment FROM feedbacks WHERE student_id = ?', [req.session.user.id]);
    const avgRating = feedbacks.length
        ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
        : '0.0';

    return res.json({ student, totalFeedbacks: feedbacks.length, avgRating });
});

// ---------- Update Profile ----------
app.put('/api/profile', requireStudent, async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;

        const student = dbGet('SELECT * FROM students WHERE id = ?', [req.session.user.id]);
        if (!student) return res.status(404).json({ error: 'Student not found.' });

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new one.' });
            }
            const match = await bcrypt.compare(currentPassword, student.password);
            if (!match) {
                return res.status(401).json({ error: 'Current password is incorrect.' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters.' });
            }
            const hashed = await bcrypt.hash(newPassword, 10);
            dbRun('UPDATE students SET password = ? WHERE id = ?', [hashed, req.session.user.id]);
        }

        if (name) {
            dbRun('UPDATE students SET name = ? WHERE id = ?', [name, req.session.user.id]);
            req.session.user.name = name;
        }

        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ---------- Delete Account ----------
app.delete('/api/profile', requireStudent, (req, res) => {
    dbRun('DELETE FROM feedbacks WHERE student_id = ?', [req.session.user.id]);
    dbRun('DELETE FROM students WHERE id = ?', [req.session.user.id]);
    req.session.destroy(() => {
        res.json({ success: true, message: 'Account deleted.' });
    });
});

// ---------- Submit Feedback ----------
app.post('/api/feedbacks', requireStudent, (req, res) => {
    try {
        const {
            studentName, usn, subjectName, facultyName,
            rating, category, feedback, questionnaire,
            sentiment, sentimentScore
        } = req.body;

        if (!subjectName || !facultyName || !rating || !feedback) {
            return res.status(400).json({ error: 'Required fields missing.' });
        }

        const q = questionnaire || {};
        const id = dbRun(
            `INSERT INTO feedbacks
             (student_id, student_name, student_email, usn,
              subject_name, faculty_name, rating, category, feedback,
              q1, q2, q3, q4, q5, q6,
              sentiment, sentiment_score, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
                req.session.user.id,
                studentName || req.session.user.name,
                req.session.user.email,
                (usn || req.session.user.usn || '').toUpperCase(),
                subjectName, facultyName,
                parseInt(rating), category, feedback,
                q.q1 || null, q.q2 || null, q.q3 || null,
                q.q4 || null, q.q5 || null, q.q6 || null,
                sentiment || 'neutral',
                parseInt(sentimentScore) || 50
            ]
        );

        return res.json({ success: true, id });
    } catch (err) {
        console.error('Feedback submit error:', err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ---------- Get My Feedbacks (student) ----------
app.get('/api/feedbacks/my', requireStudent, (req, res) => {
    const feedbacks = dbAll(
        'SELECT * FROM feedbacks WHERE student_id = ? ORDER BY timestamp DESC',
        [req.session.user.id]
    );
    return res.json({ feedbacks });
});

// ---------- Get All Feedbacks (admin) ----------
app.get('/api/admin/feedbacks', requireAdmin, (req, res) => {
    const feedbacks = dbAll('SELECT * FROM feedbacks ORDER BY timestamp DESC');
    return res.json({ feedbacks });
});

// ---------- Get All Students (admin) ----------
app.get('/api/admin/students', requireAdmin, (req, res) => {
    const students = dbAll('SELECT id, name, usn, email, created_at FROM students ORDER BY created_at DESC');
    return res.json({ students });
});

// ---------- Delete Feedback (admin) ----------
app.delete('/api/admin/feedbacks/:id', requireAdmin, (req, res) => {
    dbRun('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
});

// ---------- Export Feedbacks CSV (admin) ----------
app.get('/api/admin/export', requireAdmin, (req, res) => {
    const feedbacks = dbAll('SELECT * FROM feedbacks ORDER BY timestamp DESC');
    const headers = [
        'ID', 'Student Name', 'Email', 'USN', 'Subject', 'Faculty',
        'Rating', 'Category', 'Sentiment', 'Score', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6',
        'Feedback', 'Timestamp'
    ];
    const rows = feedbacks.map(f => [
        f.id, f.student_name, f.student_email, f.usn, f.subject_name, f.faculty_name,
        f.rating, f.category, f.sentiment, f.sentiment_score,
        f.q1, f.q2, f.q3, f.q4, f.q5, f.q6,
        `"${(f.feedback || '').replace(/"/g, '""')}"`,
        f.timestamp
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feedbacks.csv"');
    return res.send(csv);
});

// ---------- DB Stats (admin) ----------
app.get('/api/admin/db-stats', requireAdmin, (req, res) => {
    const studentCount  = dbGet('SELECT COUNT(*) as c FROM students').c;
    const feedbackCount = dbGet('SELECT COUNT(*) as c FROM feedbacks').c;

    const students = dbAll(
        'SELECT id, name, usn, email, created_at FROM students ORDER BY id DESC'
    );

    const feedbacks = dbAll(
        `SELECT id, student_name, student_email, usn,
                subject_name, faculty_name, rating,
                category, sentiment, sentiment_score,
                feedback, q1, q2, q3, q4, q5, q6, timestamp
         FROM feedbacks ORDER BY id DESC`
    );

    // Per-sentiment counts
    const sentimentCounts = dbAll(
        "SELECT sentiment, COUNT(*) as c FROM feedbacks GROUP BY sentiment"
    ).reduce((acc, r) => { acc[r.sentiment] = r.c; return acc; }, {});

    // Avg rating
    const avgRating = feedbackCount > 0
        ? dbGet('SELECT ROUND(AVG(rating),2) as avg FROM feedbacks').avg
        : 0;

    return res.json({
        counts: { students: studentCount, feedbacks: feedbackCount },
        avgRating,
        sentimentCounts,
        students,
        feedbacks
    });
});

// ---------- Serve HTML pages ----------
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ─── Start Server ─────────────────────────────────────────────────────────────
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🎓 CampusPulse server running at http://localhost:${PORT}`);
        console.log(`   Open http://localhost:${PORT}/index.html to get started\n`);
    });
}).catch(err => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
});
