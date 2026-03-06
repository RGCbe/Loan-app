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

const JWT_SECRET = process.env.JWT_SECRET || "REDACTED";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || "loans.db";
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // --- Security: Rate Limiting ---
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
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
    const { username, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
      const userId = info.lastInsertRowid;

      // Initialize capital for new user
      db.prepare("INSERT INTO capital (user_id, amount) VALUES (?, 0)").run(userId);

      const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, username } });
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
      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
      if (!user) return res.status(400).json({ error: "User not found." });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password." });

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json(req.user);
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
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/borrowers/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { name, phone, address, notes } = req.body;
    db.prepare("UPDATE borrowers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ? AND user_id = ?").run(name, phone, address, notes, req.params.id, userId);
    res.json({ success: true });
  });

  app.delete("/api/borrowers/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    db.prepare("DELETE FROM borrowers WHERE id = ? AND user_id = ?").run(req.params.id, userId);
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
