import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required. Set it in .env file.");
  process.exit(1);
}

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || "loans.db";
const db = new Database(dbPath);

// Helper for logging activity
const logActivity = (userId: number, action: string, details: string = "") => {
  try {
    db.prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)").run(userId, action, details);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    recovery_question TEXT,
    recovery_answer TEXT,
    is_premium INTEGER DEFAULT 0,
    premium_until TEXT,
    backup_enabled INTEGER DEFAULT 0,
    terms_accepted INTEGER DEFAULT 0,
    currency TEXT DEFAULT '₹',
    pin_enabled INTEGER DEFAULT 0,
    pin_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    given_amount REAL NOT NULL,
    loan_type TEXT DEFAULT 'Interest Only',
    direction TEXT DEFAULT 'Lent',
    interest_type TEXT NOT NULL,
    interest_rate REAL NOT NULL,
    installment_amount REAL,
    start_date TEXT NOT NULL,
    duration INTEGER,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS capital (
    user_id INTEGER PRIMARY KEY,
    amount REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    loan_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chit_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    total_value REAL NOT NULL,
    members_count INTEGER NOT NULL,
    duration_months INTEGER NOT NULL,
    monthly_contribution REAL NOT NULL,
    commission_percent REAL DEFAULT 5,
    start_date TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chit_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chit_group_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    slot_number INTEGER NOT NULL,
    has_won_auction INTEGER DEFAULT 0,
    auction_won_month INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (chit_group_id) REFERENCES chit_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chit_auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chit_group_id INTEGER NOT NULL,
    month_number INTEGER NOT NULL,
    auction_date TEXT NOT NULL,
    winner_member_id INTEGER NOT NULL,
    bid_amount REAL NOT NULL,
    payout_amount REAL NOT NULL,
    dividend_per_member REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (chit_group_id) REFERENCES chit_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (winner_member_id) REFERENCES chit_members (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chit_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chit_group_id INTEGER NOT NULL,
    chit_member_id INTEGER NOT NULL,
    month_number INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    status TEXT DEFAULT 'Paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (chit_group_id) REFERENCES chit_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (chit_member_id) REFERENCES chit_members (id) ON DELETE CASCADE
  );
`);

// Migration: Check if user_id exists in borrowers, if not, we need to handle legacy data or clear it.
// For this update, we will simply ensure the columns exist if someone is upgrading.
try {
  db.exec("ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN premium_until TEXT");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN backup_enabled INTEGER DEFAULT 0");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT '₹'");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN pin_enabled INTEGER DEFAULT 0");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN pin_hash TEXT");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN recovery_question TEXT");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN recovery_answer TEXT");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN terms_accepted INTEGER DEFAULT 0");
} catch (e) { }
try {
  db.exec("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT '₹'");
} catch (e) { }
try {
  db.exec("ALTER TABLE borrowers ADD COLUMN user_id INTEGER DEFAULT 1");
} catch (e) { }
try {
  db.exec("ALTER TABLE loans ADD COLUMN user_id INTEGER DEFAULT 1");
} catch (e) { }
try {
  db.exec("ALTER TABLE payments ADD COLUMN user_id INTEGER DEFAULT 1");
} catch (e) { }

// Migrate capital table
try {
  const tableInfo = db.prepare("PRAGMA table_info(capital)").all() as any[];
  const hasUserId = tableInfo.some(col => col.name === 'user_id');
  if (!hasUserId) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS capital_new (
        user_id INTEGER PRIMARY KEY,
        amount REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      INSERT INTO capital_new (user_id, amount) SELECT 1, amount FROM capital;
      DROP TABLE capital;
      ALTER TABLE capital_new RENAME TO capital;
    `);
  }
} catch (e) {
  // If capital doesn't exist at all, the main exec above handles it
}

// Seed default data if empty (only if we have at least one user)
const userResult = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
if (userResult) {
  const borrowerCount = db.prepare("SELECT COUNT(*) as count FROM borrowers").get() as any;
  if (borrowerCount.count === 0) {
    db.prepare(`
      INSERT INTO borrowers (user_id, name, phone, address, notes) 
      VALUES (?, 'Default Borrower', '9876543210', 'Main Street, India', 'Auto-generated default borrower')
    `).run(userResult.id);
  }
}

// Seed admin account on first run
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (ADMIN_USERNAME && ADMIN_PASSWORD) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(ADMIN_USERNAME) as any;
  if (!existing) {
    (async () => {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const info = db.prepare(
        "INSERT INTO users (username, password, is_premium, terms_accepted) VALUES (?, ?, 1, 1)"
      ).run(ADMIN_USERNAME, hashed);
      db.prepare("INSERT INTO capital (user_id, amount) VALUES (?, 0)").run(info.lastInsertRowid);
      logActivity(Number(info.lastInsertRowid), "Signup", "Admin account seeded");
      console.log(`Admin account "${ADMIN_USERNAME}" created with premium access.`);
    })();
  }
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // --- Security Headers ---
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // --- Security: Rate Limiting ---
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again in 15 minutes." }
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." }
  });

  const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many PIN attempts. Locked for 15 minutes." }
  });

  // Apply general rate limit to all API routes
  app.use("/api/", apiLimiter);

  // --- Input Validation Helpers ---
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNumericPin = (pin: string) => /^\d{4}$/.test(pin);
  const VALID_CURRENCIES = ['₹', '$', '€', '£', '¥', '₩', '฿', '₫', '₱', '₸', 'RM', 'Rp', '₦', 'KSh', 'R'];
  const VALID_INTEREST_TYPES = ['Daily', 'Weekly', 'Monthly'];
  const VALID_LOAN_TYPES = ['Interest Only', 'Installment'];
  const VALID_DIRECTIONS = ['Lent', 'Borrowed'];
  const VALID_STATUSES = ['Active', 'Closed'];

  // --- Auth Middleware ---
  const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid or expired token." });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/signup", authLimiter, async (req, res) => {
    let { username, password, email, recovery_question, recovery_answer, terms_accepted } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required." });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    if (email && !isValidEmail(email)) return res.status(400).json({ error: "Invalid email format." });
    if (!username.endsWith("@metrix")) {
      username = `${username}@metrix`;
    }
    try {
      if (!terms_accepted) {
        return res.status(400).json({ error: "You must accept the Terms and Conditions." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedAnswer = recovery_answer ? await bcrypt.hash(recovery_answer.toLowerCase().trim(), 10) : null;
      
      const info = db.prepare("INSERT INTO users (username, password, email, recovery_question, recovery_answer, terms_accepted) VALUES (?, ?, ?, ?, ?, ?)").run(
        username, 
        hashedPassword, 
        email || null, 
        recovery_question || null, 
        hashedAnswer,
        1
      );
      const userId = info.lastInsertRowid;

      // Initialize capital for new user
      db.prepare("INSERT INTO capital (user_id, amount) VALUES (?, 0)").run(userId);

      // First registered user (id=1) is the admin — auto-grant premium
      const isPremium = Number(userId) === 1 ? 1 : 0;
      if (isPremium) {
        db.prepare("UPDATE users SET is_premium = 1 WHERE id = ?").run(userId);
      }

      const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
      logActivity(Number(userId), "Signup", "New account created");
      res.json({ token, user: { id: userId, username, is_premium: isPremium, backup_enabled: 0, pin_enabled: 0 } });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Username already exists." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    let { username, password } = req.body;
    if (!username.endsWith("@metrix")) {
      username = `${username}@metrix`;
    }
    try {
      const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username) as any;
      if (!user) return res.status(400).json({ error: "User not found." });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password." });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      logActivity(user.id, "Login", "User logged in");
      res.json({ token, user: { id: user.id, username: user.username, is_premium: user.is_premium, backup_enabled: user.backup_enabled, currency: user.currency, pin_enabled: user.pin_enabled } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    const user = db.prepare("SELECT id, username, email, is_premium, premium_until, backup_enabled, currency, pin_enabled FROM users WHERE id = ?").get(req.user!.id) as any;
    
    // Check if premium expired
    if (user && user.is_premium === 1 && user.premium_until) {
      const until = new Date(user.premium_until);
      if (until < new Date()) {
        db.prepare("UPDATE users SET is_premium = 0 WHERE id = ?").run(user.id);
        user.is_premium = 0;
      }
    }
    
    res.json(user);
  });

  // --- Token Refresh ---
  app.post("/api/auth/refresh", authenticateToken, (req: AuthenticatedRequest, res) => {
    const user = db.prepare("SELECT id, username FROM users WHERE id = ?").get(req.user!.id) as any;
    if (!user) return res.status(404).json({ error: "User not found." });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  });

  // Recovery Routes
  app.post("/api/auth/recovery/find-username", authLimiter, (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });
    const user = db.prepare("SELECT username FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(404).json({ error: "Recovery not available for this account." });
    res.json({ username: user.username });
  });

  app.post("/api/auth/recovery/get-question", authLimiter, (req, res) => {
    const { identifier } = req.body; // username or email
    if (!identifier) return res.status(400).json({ error: "Username or email is required." });
    const user = db.prepare("SELECT recovery_question FROM users WHERE username = ? OR email = ?").get(identifier, identifier) as any;
    if (!user || !user.recovery_question) return res.status(404).json({ error: "Recovery not available for this account." });
    res.json({ question: user.recovery_question });
  });

  app.post("/api/auth/recovery/reset-password", authLimiter, async (req, res) => {
    const { identifier, answer, newPassword } = req.body;
    if (!identifier || !answer || !newPassword) return res.status(400).json({ error: "All fields are required." });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    const user = db.prepare("SELECT id, recovery_answer FROM users WHERE username = ? OR email = ?").get(identifier, identifier) as any;

    // Generic error to prevent enumeration
    if (!user || !user.recovery_answer) return res.status(401).json({ error: "Recovery failed. Check your details and try again." });

    const valid = await bcrypt.compare(answer.toLowerCase().trim(), user.recovery_answer);
    if (!valid) return res.status(401).json({ error: "Recovery failed. Check your details and try again." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);

    logActivity(user.id, "Password Reset", "Password reset via security question");
    res.json({ success: true });
  });

  app.post("/api/user/upgrade", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { payment_token } = req.body;
    // Require a valid payment token from a payment gateway (Stripe, Google Play, etc.)
    if (!payment_token) {
      return res.status(402).json({ error: "Payment required. Please complete the payment flow." });
    }
    // TODO: Verify payment_token with payment provider before upgrading
    db.prepare("UPDATE users SET is_premium = 1 WHERE id = ?").run(userId);
    logActivity(userId, "Upgrade Account", "Account upgraded to premium");
    res.json({ success: true });
  });

  app.get("/api/user/export", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const borrowers = db.prepare("SELECT * FROM borrowers WHERE user_id = ?").all(userId);
    const loans = db.prepare("SELECT * FROM loans WHERE user_id = ?").all(userId);
    const payments = db.prepare("SELECT p.* FROM payments p JOIN loans l ON p.loan_id = l.id WHERE l.user_id = ?").all(userId);
    const capital = db.prepare("SELECT * FROM capital WHERE user_id = ?").get(userId);
    const logs = db.prepare("SELECT * FROM activity_log WHERE user_id = ?").all(userId);

    res.json({
      borrowers,
      loans,
      payments,
      capital,
      logs,
      exported_at: new Date().toISOString()
    });
  });

  app.post("/api/user/import", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { borrowers, loans, payments } = req.body;

    if (!borrowers || !Array.isArray(borrowers)) return res.status(400).json({ error: "Invalid backup: missing borrowers array" });
    if (!loans || !Array.isArray(loans)) return res.status(400).json({ error: "Invalid backup: missing loans array" });
    if (!payments || !Array.isArray(payments)) return res.status(400).json({ error: "Invalid backup: missing payments array" });

    const transaction = db.transaction(() => {
      const borrowerIdMap = new Map<number, number>();
      const loanIdMap = new Map<number, number>();

      for (const b of borrowers) {
        const name = (b.name || '').trim();
        if (!name) continue;
        const result = db.prepare("INSERT INTO borrowers (user_id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)").run(
          userId, name, b.phone || '', b.address || '', b.notes || ''
        );
        borrowerIdMap.set(b.id, Number(result.lastInsertRowid));
      }

      for (const l of loans) {
        const newBorrowerId = borrowerIdMap.get(l.borrower_id);
        if (!newBorrowerId) continue;
        const result = db.prepare(
          "INSERT INTO loans (user_id, borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(
          userId, newBorrowerId, l.amount || 0, l.given_amount || 0,
          l.loan_type || 'Interest Only', l.direction || 'Lent',
          l.interest_type || 'Monthly', l.interest_rate || 0,
          l.installment_amount || null, l.start_date || new Date().toISOString().split('T')[0],
          l.duration || null, l.status || 'Active'
        );
        loanIdMap.set(l.id, Number(result.lastInsertRowid));
      }

      for (const p of payments) {
        const newLoanId = loanIdMap.get(p.loan_id);
        if (!newLoanId) continue;
        db.prepare(
          "INSERT INTO payments (user_id, loan_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)"
        ).run(userId, newLoanId, p.amount || 0, p.payment_date || new Date().toISOString().split('T')[0], p.notes || '');
      }

      logActivity(userId, "Import Data", `Imported ${borrowers.length} borrowers, ${loans.length} loans, ${payments.length} payments`);
    });

    try {
      transaction();
      res.json({ success: true, message: "Data imported successfully" });
    } catch (err: any) {
      console.error("Import error:", err);
      res.status(500).json({ error: "Failed to import data" });
    }
  });

  app.delete("/api/user/account", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    db.prepare("DELETE FROM activity_log WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM payments WHERE loan_id IN (SELECT id FROM loans WHERE user_id = ?)").run(userId);
    db.prepare("DELETE FROM loans WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM borrowers WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM capital WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  app.post("/api/user/backup", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { enabled } = req.body;
    db.prepare("UPDATE users SET backup_enabled = ? WHERE id = ?").run(enabled ? 1 : 0, userId);
    res.json({ success: true });
  });

  app.post("/api/user/change-password", authenticateToken, authLimiter, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: "Current and new password are required" });
    if (new_password.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashed, userId);
    logActivity(userId, "Change Password", "Password changed successfully");
    res.json({ success: true });
  });

  app.post("/api/user/currency", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { currency } = req.body;
    if (!currency || !VALID_CURRENCIES.includes(currency)) return res.status(400).json({ error: "Invalid currency. Supported: " + VALID_CURRENCIES.join(', ') });
    db.prepare("UPDATE users SET currency = ? WHERE id = ?").run(currency, userId);
    logActivity(userId, "Update Currency", `Currency changed to ${currency}`);
    res.json({ success: true });
  });

  // PIN Management
  app.post("/api/user/pin/setup", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { pin } = req.body;
    if (!pin || !isNumericPin(pin)) return res.status(400).json({ error: "PIN must be exactly 4 digits (0-9)" });
    
    const hashedPin = await bcrypt.hash(pin, 10);
    db.prepare("UPDATE users SET pin_hash = ?, pin_enabled = 1 WHERE id = ?").run(hashedPin, userId);
    logActivity(userId, "PIN Setup", "Security PIN configured");
    res.json({ success: true });
  });

  app.post("/api/user/pin/verify", pinLimiter, authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { pin } = req.body;
    const user = db.prepare("SELECT pin_hash FROM users WHERE id = ?").get(userId) as any;
    
    if (!user || !user.pin_hash) return res.status(400).json({ error: "PIN not setup" });
    
    const valid = await bcrypt.compare(pin, user.pin_hash);
    if (!valid) return res.status(401).json({ error: "Incorrect PIN" });
    
    res.json({ success: true });
  });

  app.post("/api/user/pin/toggle", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { enabled } = req.body;
    db.prepare("UPDATE users SET pin_enabled = ? WHERE id = ?").run(enabled ? 1 : 0, userId);
    logActivity(userId, "PIN Toggle", `PIN security ${enabled ? 'enabled' : 'disabled'}`);
    res.json({ success: true });
  });

  // Activity Log
  app.get("/api/activity", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const logs = db.prepare("SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(userId);
    res.json(logs);
  });

  app.get("/api/export/loans", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const loans = db.prepare(`
      SELECT l.*, b.name as borrower_name 
      FROM loans l 
      JOIN borrowers b ON l.borrower_id = b.id 
      WHERE l.user_id = ?
    `).all(userId) as any[];

    const csvRows = [
      ["ID", "Borrower", "Amount", "Given Amount", "Interest Rate", "Type", "Status", "Start Date"].join(",")
    ];

    loans.forEach(loan => {
      csvRows.push([
        loan.id,
        `"${loan.borrower_name}"`,
        loan.amount,
        loan.given_amount,
        loan.interest_rate,
        loan.loan_type,
        loan.status,
        loan.start_date
      ].join(","));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=loans_export.csv');
    res.send(csvRows.join("\n"));
  });

  // --- Scoped API Routes ---

  // Dashboard Stats
  app.get("/api/stats", authenticateToken, (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const totalLent = db.prepare("SELECT SUM(given_amount) as total FROM loans WHERE user_id = ? AND direction = 'Lent'").get(userId) as any;
      const totalBorrowed = db.prepare("SELECT SUM(given_amount) as total FROM loans WHERE user_id = ? AND direction = 'Borrowed'").get(userId) as any;
      const totalCollected = db.prepare("SELECT SUM(p.amount) as total FROM payments p JOIN loans l ON p.loan_id = l.id WHERE p.user_id = ? AND l.direction = 'Lent'").get(userId) as any;
      const activeBorrowers = db.prepare("SELECT COUNT(DISTINCT borrower_id) as count FROM loans WHERE user_id = ? AND status = 'Active' AND direction = 'Lent'").get(userId) as any;
      const capital = db.prepare("SELECT amount FROM capital WHERE user_id = ?").get(userId) as any;

      res.json({
        totalGiven: totalLent.total || 0,
        totalBorrowed: totalBorrowed.total || 0,
        totalCollected: totalCollected.total || 0,
        activeBorrowers: activeBorrowers.count || 0,
        investedCapital: capital?.amount || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Capital Management
  app.get("/api/capital", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const capital = db.prepare("SELECT amount FROM capital WHERE user_id = ?").get(userId) as any;
    res.json(capital || { amount: 0 });
  });

  app.post("/api/capital", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { amount } = req.body;
    db.prepare("INSERT OR REPLACE INTO capital (user_id, amount) VALUES (?, ?)").run(userId, amount);
    logActivity(userId, "Update Capital", `Total capital set to ${amount}`);
    res.json({ success: true });
  });

  // Helper for loan calculations
  const getLoanSummary = (loan: any) => {
    const payments = db.prepare("SELECT * FROM payments WHERE loan_id = ?").all(loan.id) as any[];

    let currentPrincipal = loan.amount;
    let totalAccruedInterest = 0;
    let lastDate = new Date(loan.start_date);
    const now = new Date();

    const sortedPayments = [...payments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());

    if (loan.loan_type === 'Installment') {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...loan,
        accruedInterest: 0,
        paidAmount: totalPaid,
        balance: Math.max(0, loan.amount - totalPaid),
        currentPrincipal: Math.max(0, loan.amount - totalPaid)
      };
    }

    for (const payment of sortedPayments) {
      const paymentDate = new Date(payment.payment_date);
      const diffTime = Math.max(0, paymentDate.getTime() - lastDate.getTime());

      let periods = 0;
      if (loan.interest_type === 'Daily') {
        periods = diffTime / (1000 * 60 * 60 * 24);
      } else if (loan.interest_type === 'Weekly') {
        periods = diffTime / (1000 * 60 * 60 * 24 * 7);
      } else if (loan.interest_type === 'Monthly') {
        periods = diffTime / (1000 * 60 * 60 * 24 * 30);
      }

      const interest = currentPrincipal * (loan.interest_rate / 100) * periods;
      totalAccruedInterest += interest;

      let paymentRemaining = payment.amount;
      const interestPaid = Math.min(paymentRemaining, totalAccruedInterest);
      totalAccruedInterest -= interestPaid;
      paymentRemaining -= interestPaid;

      currentPrincipal -= paymentRemaining;
      lastDate = paymentDate;
    }

    const finalDiffTime = Math.max(0, now.getTime() - lastDate.getTime());
    let finalPeriods = 0;
    if (loan.interest_type === 'Daily') {
      finalPeriods = finalDiffTime / (1000 * 60 * 60 * 24);
    } else if (loan.interest_type === 'Weekly') {
      finalPeriods = finalDiffTime / (1000 * 60 * 60 * 24 * 7);
    } else if (loan.interest_type === 'Monthly') {
      finalPeriods = finalDiffTime / (1000 * 60 * 60 * 24 * 30);
    }

    const finalInterest = currentPrincipal * (loan.interest_rate / 100) * finalPeriods;
    totalAccruedInterest += finalInterest;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...loan,
      accruedInterest: totalAccruedInterest,
      paidAmount: totalPaid,
      balance: Math.max(0, currentPrincipal + totalAccruedInterest),
      currentPrincipal: Math.max(0, currentPrincipal)
    };
  };

  // Borrowers
  app.get("/api/borrowers", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const borrowers = db.prepare("SELECT * FROM borrowers WHERE user_id = ? ORDER BY name ASC").all(userId);
    res.json(borrowers);
  });

  app.post("/api/borrowers", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, phone, address, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Borrower name is required." });
    const info = db.prepare("INSERT INTO borrowers (user_id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)").run(userId, name.trim(), phone, address, notes);
    logActivity(userId, "Add Borrower", `Added borrower: ${name}`);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/borrowers/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const borrowerId = parseInt(req.params.id);
    if (isNaN(borrowerId)) return res.status(400).json({ error: "Invalid borrower ID" });
    const { name, phone, address, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
    const trimmedName = name.trim();
    const existing = db.prepare("SELECT id FROM borrowers WHERE id = ? AND user_id = ?").get(borrowerId, userId);
    if (!existing) return res.status(404).json({ error: "Borrower not found" });
    db.prepare("UPDATE borrowers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ? AND user_id = ?").run(trimmedName, phone || '', address || '', notes || '', borrowerId, userId);
    logActivity(userId, "Update Borrower", `Updated borrower: ${trimmedName} (ID: ${borrowerId})`);
    res.json({ success: true });
  });

  app.delete("/api/borrowers/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    db.prepare("DELETE FROM borrowers WHERE id = ? AND user_id = ?").run(req.params.id, userId);
    logActivity(userId, "Delete Borrower", `Deleted borrower ID: ${req.params.id}`);
    res.json({ success: true });
  });

  // Loans
  app.get("/api/loans", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const loans = db.prepare(`
      SELECT l.*, b.name as borrower_name 
      FROM loans l 
      JOIN borrowers b ON l.borrower_id = b.id 
      WHERE l.user_id = ?
  ORDER BY l.created_at DESC
    `).all(userId);
    res.json(loans.map(l => getLoanSummary(l)));
  });

  app.get("/api/borrowers/:id/loans", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const loans = db.prepare("SELECT * FROM loans WHERE borrower_id = ? AND user_id = ?").all(req.params.id, userId);
    res.json(loans.map(l => getLoanSummary(l)));
  });

  app.post("/api/loans", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration } = req.body;
    if (!borrower_id) return res.status(400).json({ error: "Borrower is required." });
    if (!amount || amount <= 0) return res.status(400).json({ error: "Amount must be positive." });
    if (!given_amount || given_amount <= 0) return res.status(400).json({ error: "Given amount must be positive." });
    if (interest_rate < 0 || interest_rate > 100) return res.status(400).json({ error: "Interest rate must be between 0 and 100." });
    if (!interest_type || !VALID_INTEREST_TYPES.includes(interest_type)) return res.status(400).json({ error: "Interest type must be Daily, Weekly, or Monthly." });
    if (loan_type && !VALID_LOAN_TYPES.includes(loan_type)) return res.status(400).json({ error: "Loan type must be 'Interest Only' or 'Installment'." });
    if (direction && !VALID_DIRECTIONS.includes(direction)) return res.status(400).json({ error: "Direction must be 'Lent' or 'Borrowed'." });
    if (!start_date) return res.status(400).json({ error: "Start date is required." });
    // Verify borrower belongs to user
    const borrower = db.prepare("SELECT id FROM borrowers WHERE id = ? AND user_id = ?").get(borrower_id, userId);
    if (!borrower) return res.status(404).json({ error: "Borrower not found." });
    const info = db.prepare(`
      INSERT INTO loans(user_id, borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, borrower_id, amount, given_amount, loan_type, direction || 'Lent', interest_type, interest_rate, installment_amount, start_date, duration);
    logActivity(userId, "Add Loan", `Created ${loan_type} loan of ${amount} (ID: ${info.lastInsertRowid})`);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/loans/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const existing = db.prepare("SELECT * FROM loans WHERE id = ? AND user_id = ?").get(req.params.id, userId) as any;
    if (!existing) return res.status(404).json({ error: "Loan not found" });

    const amount = req.body.amount ?? existing.amount;
    const given_amount = req.body.given_amount ?? existing.given_amount;
    const loan_type = req.body.loan_type ?? existing.loan_type;
    const direction = req.body.direction ?? existing.direction;
    const interest_type = req.body.interest_type ?? existing.interest_type;
    const interest_rate = req.body.interest_rate ?? existing.interest_rate;
    const installment_amount = req.body.installment_amount ?? existing.installment_amount;
    const start_date = req.body.start_date ?? existing.start_date;
    const duration = req.body.duration ?? existing.duration;
    const status = req.body.status ?? existing.status;

    if (req.body.interest_type && !VALID_INTEREST_TYPES.includes(req.body.interest_type)) return res.status(400).json({ error: "Invalid interest type." });
    if (req.body.loan_type && !VALID_LOAN_TYPES.includes(req.body.loan_type)) return res.status(400).json({ error: "Invalid loan type." });
    if (req.body.direction && !VALID_DIRECTIONS.includes(req.body.direction)) return res.status(400).json({ error: "Invalid direction." });
    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) return res.status(400).json({ error: "Status must be Active or Closed." });
    if (req.body.amount !== undefined && req.body.amount <= 0) return res.status(400).json({ error: "Amount must be positive." });
    if (req.body.interest_rate !== undefined && (req.body.interest_rate < 0 || req.body.interest_rate > 100)) return res.status(400).json({ error: "Interest rate must be 0-100." });

    db.prepare(`
      UPDATE loans
      SET amount = ?, given_amount = ?, loan_type = ?, direction = ?,
          interest_type = ?, interest_rate = ?, installment_amount = ?,
          start_date = ?, duration = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(
      amount, given_amount, loan_type, direction,
      interest_type, interest_rate, installment_amount,
      start_date, duration, status,
      req.params.id, userId
    );
    logActivity(userId, "Update Loan", `Updated loan ID: ${req.params.id} (Status: ${status})`);
    res.json({ success: true });
  });

  // Payments
  app.get("/api/loans/:id/payments", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const payments = db.prepare("SELECT * FROM payments WHERE loan_id = ? AND user_id = ? ORDER BY payment_date DESC").all(req.params.id, userId);
    res.json(payments);
  });

  app.post("/api/payments", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { loan_id, amount, payment_date, notes } = req.body;
    if (!loan_id) return res.status(400).json({ error: "Loan ID is required." });
    if (!amount || amount <= 0) return res.status(400).json({ error: "Payment amount must be positive." });
    if (!payment_date) return res.status(400).json({ error: "Payment date is required." });
    // Verify loan belongs to user
    const loan = db.prepare("SELECT id FROM loans WHERE id = ? AND user_id = ?").get(loan_id, userId);
    if (!loan) return res.status(404).json({ error: "Loan not found." });
    const info = db.prepare("INSERT INTO payments (user_id, loan_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)").run(userId, loan_id, amount, payment_date, notes);
    logActivity(userId, "Record Payment", `Recorded payment of ${amount} for loan ID: ${loan_id}`);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/payments/bulk", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { payments, payment_date, notes } = req.body; // payments: [{ loan_id, amount }]
    
    try {
      db.transaction(() => {
        for (const p of payments) {
          db.prepare("INSERT INTO payments (user_id, loan_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)")
            .run(userId, p.loan_id, p.amount, payment_date, notes || "Bulk Payment");
        }
      })();
      logActivity(userId, "Bulk Payment", `Recorded bulk payment for ${payments.length} loans`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/loans/consolidate", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { loan_ids, new_loan_details } = req.body;
    
    try {
      db.transaction(() => {
        let totalBalance = 0;
        let borrowerId = null;

        for (const id of loan_ids) {
          const loan = db.prepare("SELECT * FROM loans WHERE id = ? AND user_id = ?").get(id, userId) as any;
          if (!loan) throw new Error(`Loan ${id} not found`);
          
          if (borrowerId === null) borrowerId = loan.borrower_id;
          else if (borrowerId !== loan.borrower_id) throw new Error("All loans must belong to the same borrower");

          const summary = getLoanSummary(loan);
          totalBalance += summary.balance;

          // Close original loan
          db.prepare("UPDATE loans SET status = 'Closed' WHERE id = ? AND user_id = ?").run(id, userId);
          db.prepare("INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)")
            .run(userId, "Loan Closed (Consolidated)", `Loan ID ${id} closed due to consolidation`);
        }

        // Create new consolidated loan
        const { loan_type, interest_type, interest_rate, installment_amount, start_date, duration } = new_loan_details;
        const info = db.prepare(`
          INSERT INTO loans(user_id, borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration)
          VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, borrowerId, totalBalance, totalBalance, loan_type, 'Lent', interest_type, interest_rate, installment_amount, start_date, duration);

        logActivity(userId, "Consolidate Loans", `Consolidated ${loan_ids.length} loans into new loan ID: ${info.lastInsertRowid}`);
      })();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Chit Fund Routes ---

  app.get("/api/chit-groups", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const groups = db.prepare("SELECT * FROM chit_groups WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(groups);
  });

  app.post("/api/chit-groups", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, total_value, members_count, duration_months, monthly_contribution, commission_percent, start_date } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Group name is required." });
    if (!total_value || total_value <= 0) return res.status(400).json({ error: "Total value must be positive." });
    if (!members_count || members_count < 2) return res.status(400).json({ error: "Must have at least 2 members." });
    if (!duration_months || duration_months < 1) return res.status(400).json({ error: "Duration must be at least 1 month." });
    if (!monthly_contribution || monthly_contribution <= 0) return res.status(400).json({ error: "Monthly contribution must be positive." });
    if (!start_date) return res.status(400).json({ error: "Start date is required." });
    const info = db.prepare(`
      INSERT INTO chit_groups (user_id, name, total_value, members_count, duration_months, monthly_contribution, commission_percent, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, name, total_value, members_count, duration_months, monthly_contribution, commission_percent, start_date);
    logActivity(userId, "Create Chit Group", `Created chit group: ${name}`);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/chit-groups/:id/members", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const members = db.prepare(`
      SELECT cm.*, b.name as borrower_name, b.phone 
      FROM chit_members cm
      JOIN borrowers b ON cm.borrower_id = b.id
      WHERE cm.chit_group_id = ? AND cm.user_id = ?
      ORDER BY cm.slot_number ASC
    `).all(req.params.id, userId);
    res.json(members);
  });

  app.post("/api/chit-groups/:id/members", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).json({ error: "Invalid group ID" });
    const group = db.prepare("SELECT id FROM chit_groups WHERE id = ? AND user_id = ?").get(groupId, userId);
    if (!group) return res.status(404).json({ error: "Chit group not found" });
    const { borrower_id, slot_number } = req.body;
    if (!borrower_id || !slot_number) return res.status(400).json({ error: "Borrower and slot number are required" });
    const borrower = db.prepare("SELECT id FROM borrowers WHERE id = ? AND user_id = ?").get(borrower_id, userId);
    if (!borrower) return res.status(404).json({ error: "Borrower not found" });
    const info = db.prepare(`
      INSERT INTO chit_members (user_id, chit_group_id, borrower_id, slot_number)
      VALUES (?, ?, ?, ?)
    `).run(userId, groupId, borrower_id, slot_number);
    logActivity(userId, "Add Chit Member", `Added member to chit group ID: ${groupId}`);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/chit-groups/:id/auctions", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const auctions = db.prepare(`
      SELECT ca.*, b.name as winner_name
      FROM chit_auctions ca
      JOIN chit_members cm ON ca.winner_member_id = cm.id
      JOIN borrowers b ON cm.borrower_id = b.id
      WHERE ca.chit_group_id = ? AND ca.user_id = ?
      ORDER BY ca.month_number ASC
    `).all(req.params.id, userId);
    res.json(auctions);
  });

  app.post("/api/chit-groups/:id/auctions", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).json({ error: "Invalid group ID" });
    const group = db.prepare("SELECT id FROM chit_groups WHERE id = ? AND user_id = ?").get(groupId, userId);
    if (!group) return res.status(404).json({ error: "Chit group not found" });
    const { month_number, auction_date, winner_member_id, bid_amount, payout_amount, dividend_per_member } = req.body;
    if (!month_number || !auction_date || !winner_member_id) return res.status(400).json({ error: "Month, date, and winner are required" });
    if (bid_amount <= 0 || payout_amount <= 0) return res.status(400).json({ error: "Amounts must be positive" });

    try {
      db.transaction(() => {
        db.prepare(`
          INSERT INTO chit_auctions (user_id, chit_group_id, month_number, auction_date, winner_member_id, bid_amount, payout_amount, dividend_per_member)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, groupId, month_number, auction_date, winner_member_id, bid_amount, payout_amount, dividend_per_member);

        db.prepare("UPDATE chit_members SET has_won_auction = 1, auction_won_month = ? WHERE id = ?").run(month_number, winner_member_id);
      })();

      logActivity(userId, "Record Auction", `Recorded auction for month ${month_number} in chit group ID: ${groupId}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to record auction" });
    }
  });

  app.get("/api/chit-groups/:id/payments", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const payments = db.prepare("SELECT * FROM chit_payments WHERE chit_group_id = ? AND user_id = ?").all(req.params.id, userId);
    res.json(payments);
  });

  app.post("/api/chit-payments", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { chit_group_id, chit_member_id, month_number, amount, payment_date } = req.body;
    if (!chit_group_id || !chit_member_id || !month_number || !payment_date) return res.status(400).json({ error: "All fields are required" });
    if (!amount || amount <= 0) return res.status(400).json({ error: "Amount must be positive" });
    const group = db.prepare("SELECT id FROM chit_groups WHERE id = ? AND user_id = ?").get(chit_group_id, userId);
    if (!group) return res.status(404).json({ error: "Chit group not found" });
    const info = db.prepare(`
      INSERT INTO chit_payments (user_id, chit_group_id, chit_member_id, month_number, amount, payment_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, chit_group_id, chit_member_id, month_number, amount, payment_date);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/chit-payments/bulk", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { chit_group_id, payments, month_number, payment_date } = req.body;
    if (!chit_group_id || !month_number || !payment_date) return res.status(400).json({ error: "Group, month, and date are required" });
    if (!payments || !Array.isArray(payments) || payments.length === 0) return res.status(400).json({ error: "Payments array is required" });
    const group = db.prepare("SELECT id FROM chit_groups WHERE id = ? AND user_id = ?").get(chit_group_id, userId);
    if (!group) return res.status(404).json({ error: "Chit group not found" });
    for (const p of payments) {
      if (!p.amount || p.amount <= 0) return res.status(400).json({ error: "All payment amounts must be positive" });
    }

    try {
      db.transaction(() => {
        for (const p of payments) {
          db.prepare(`
            INSERT INTO chit_payments (user_id, chit_group_id, chit_member_id, month_number, amount, payment_date)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(userId, chit_group_id, p.chit_member_id, month_number, p.amount, payment_date);
        }
      })();
      logActivity(userId, "Bulk Chit Payment", `Recorded bulk payment for ${payments.length} members in group ${chit_group_id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reports
  app.get("/api/reports", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const loans = db.prepare(`
      SELECT l.*, b.name as borrower_name
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.user_id = ?
  `).all(userId);
    res.json(loans.map(l => getLoanSummary(l)));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
