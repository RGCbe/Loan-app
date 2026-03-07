import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "REDACTED";

// Razorpay Initialization
let razorpayInstance: Razorpay | null = null;
function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required");
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
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

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Razorpay Webhook
  app.post("/api/razorpay/webhook", express.json(), async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!secret || !signature) {
      return res.status(400).send("Webhook Error: Missing signature or secret");
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).send("Webhook Error: Invalid signature");
    }

    const event = req.body;
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const userId = payment.notes.userId;
      const planType = payment.notes.planType;

      if (userId) {
        let premiumUntil: string | null = null;
        const now = new Date();
        
        if (planType === "monthly") {
          now.setMonth(now.getMonth() + 1);
          premiumUntil = now.toISOString();
        } else if (planType === "yearly") {
          now.setFullYear(now.getFullYear() + 1);
          premiumUntil = now.toISOString();
        } else if (planType === "lifetime") {
          premiumUntil = "9999-12-31T23:59:59.999Z";
        }

        db.prepare("UPDATE users SET is_premium = 1, premium_until = ? WHERE id = ?").run(premiumUntil, userId);
        logActivity(parseInt(userId), "Upgrade Account", `Account upgraded via Razorpay (${planType})`);
      }
    }

    res.json({ status: "ok" });
  });

  app.use(express.json());

  // --- Security: Rate Limiting ---
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.headers['x-forwarded-for'] as string) || 
             (req.headers['forwarded'] as string) || 
             req.ip || 
             'unknown';
    },
    message: { error: "Too many login attempts. Please try again in 15 minutes." }
  });

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
    const { username, password, email, recovery_question, recovery_answer, terms_accepted } = req.body;
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

      const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
      logActivity(Number(userId), "Signup", "New account created");
      res.json({ token, user: { id: userId, username, is_premium: 0, backup_enabled: 0, pin_enabled: 0 } });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Username already exists." });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { username, password } = req.body;
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

  // Recovery Routes
  app.post("/api/auth/recovery/find-username", authLimiter, (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT username FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(404).json({ error: "No account found with this email." });
    res.json({ username: user.username });
  });

  app.post("/api/auth/recovery/get-question", authLimiter, (req, res) => {
    const { identifier } = req.body; // username or email
    const user = db.prepare("SELECT recovery_question FROM users WHERE username = ? OR email = ?").get(identifier, identifier) as any;
    if (!user || !user.recovery_question) return res.status(404).json({ error: "Recovery not setup for this account." });
    res.json({ question: user.recovery_question });
  });

  app.post("/api/auth/recovery/reset-password", authLimiter, async (req, res) => {
    const { identifier, answer, newPassword } = req.body;
    const user = db.prepare("SELECT id, recovery_answer FROM users WHERE username = ? OR email = ?").get(identifier, identifier) as any;
    
    if (!user || !user.recovery_answer) return res.status(404).json({ error: "Recovery not setup." });
    
    const valid = await bcrypt.compare(answer.toLowerCase().trim(), user.recovery_answer);
    if (!valid) return res.status(401).json({ error: "Incorrect answer." });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, user.id);
    
    logActivity(user.id, "Password Reset", "Password reset via security question");
    res.json({ success: true });
  });

  app.get("/api/razorpay/key", (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
  });

  app.post("/api/razorpay/order", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { planType } = req.body;
      
      let amount = 0;
      if (planType === "monthly") amount = 10000; // ₹100.00
      else if (planType === "yearly") amount = 100000; // ₹1000.00
      else if (planType === "lifetime") amount = 499900; // ₹4999.00
      else return res.status(400).json({ error: "Invalid plan type" });

      const options = {
        amount: amount,
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          planType: planType
        }
      };

      const order = await getRazorpay().orders.create(options);
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/razorpay/verify", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;
    const userId = req.user!.id;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) return res.status(500).json({ error: "Server configuration error" });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      let premiumUntil: string | null = null;
      const now = new Date();
      
      if (planType === "monthly") {
        now.setMonth(now.getMonth() + 1);
        premiumUntil = now.toISOString();
      } else if (planType === "yearly") {
        now.setFullYear(now.getFullYear() + 1);
        premiumUntil = now.toISOString();
      } else if (planType === "lifetime") {
        premiumUntil = "9999-12-31T23:59:59.999Z";
      }

      db.prepare("UPDATE users SET is_premium = 1, premium_until = ? WHERE id = ?").run(premiumUntil, userId);
      logActivity(userId, "Upgrade Account", `Account upgraded via Razorpay (${planType})`);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid signature" });
    }
  });

  app.post("/api/user/upgrade", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
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

  app.post("/api/user/currency", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { currency } = req.body;
    db.prepare("UPDATE users SET currency = ? WHERE id = ?").run(currency, userId);
    logActivity(userId, "Update Currency", `Currency changed to ${currency}`);
    res.json({ success: true });
  });

  // PIN Management
  app.post("/api/user/pin/setup", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { pin } = req.body;
    if (!pin || pin.length !== 4) return res.status(400).json({ error: "PIN must be 4 digits" });
    
    const hashedPin = await bcrypt.hash(pin, 10);
    db.prepare("UPDATE users SET pin_hash = ?, pin_enabled = 1 WHERE id = ?").run(hashedPin, userId);
    logActivity(userId, "PIN Setup", "Security PIN configured");
    res.json({ success: true });
  });

  app.post("/api/user/pin/verify", authenticateToken, async (req: AuthenticatedRequest, res) => {
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
    const info = db.prepare("INSERT INTO borrowers (user_id, name, phone, address, notes) VALUES (?, ?, ?, ?, ?)").run(userId, name, phone, address, notes);
    logActivity(userId, "Add Borrower", `Added borrower: ${name}`);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/borrowers/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, phone, address, notes } = req.body;
    db.prepare("UPDATE borrowers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ? AND user_id = ?").run(name, phone, address, notes, req.params.id, userId);
    logActivity(userId, "Update Borrower", `Updated borrower: ${name} (ID: ${req.params.id})`);
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
    const info = db.prepare(`
      INSERT INTO loans(user_id, borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, borrower_id, amount, given_amount, loan_type, direction || 'Lent', interest_type, interest_rate, installment_amount, start_date, duration);
    logActivity(userId, "Add Loan", `Created ${loan_type} loan of ${amount} (ID: ${info.lastInsertRowid})`);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/loans/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const {
      amount,
      given_amount,
      loan_type,
      direction,
      interest_type,
      interest_rate,
      installment_amount,
      start_date,
      duration,
      status
    } = req.body;

    db.prepare(`
      UPDATE loans 
      SET amount = ?,
  given_amount = ?,
  loan_type = ?,
  direction = ?,
  interest_type = ?,
  interest_rate = ?,
  installment_amount = ?,
  start_date = ?,
  duration = ?,
  status = ?
    WHERE id = ? AND user_id = ?
      `).run(
      amount,
      given_amount,
      loan_type,
      direction,
      interest_type,
      interest_rate,
      installment_amount,
      start_date,
      duration,
      status,
      req.params.id,
      userId
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
    const info = db.prepare("INSERT INTO payments (user_id, loan_id, amount, payment_date, notes) VALUES (?, ?, ?, ?, ?)").run(userId, loan_id, amount, payment_date, notes);
    logActivity(userId, "Record Payment", `Recorded payment of ${amount} for loan ID: ${loan_id}`);
    res.json({ id: info.lastInsertRowid });
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
