import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("loans.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_id INTEGER NOT NULL,
    amount REAL NOT NULL, -- Total amount to be repaid
    given_amount REAL NOT NULL, -- Actual amount handed to borrower
    loan_type TEXT DEFAULT 'Interest Only', -- 'Interest Only' or 'Installment'
    direction TEXT DEFAULT 'Lent', -- 'Lent' (I give money) or 'Borrowed' (I take money)
    interest_type TEXT NOT NULL, -- 'Daily', 'Weekly', 'Monthly'
    interest_rate REAL NOT NULL,
    installment_amount REAL, -- Fixed amount to pay per period
    start_date TEXT NOT NULL,
    duration INTEGER, -- Nullable for open-ended
    status TEXT DEFAULT 'Active', -- 'Active', 'Closed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS capital (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    amount REAL DEFAULT 0
  );

  INSERT OR IGNORE INTO capital (id, amount) VALUES (1, 0);

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans (id) ON DELETE CASCADE
  );
`);

// Seed default data if empty
const borrowerCount = db.prepare("SELECT COUNT(*) as count FROM borrowers").get() as any;
if (borrowerCount.count === 0) {
  const borrowerInfo = db.prepare(`
    INSERT INTO borrowers (name, phone, address, notes) 
    VALUES ('Default Borrower', '9876543210', 'Main Street, India', 'Auto-generated default borrower')
  `).run();
  
  const borrowerId = borrowerInfo.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO loans (borrower_id, amount, given_amount, loan_type, interest_type, interest_rate, start_date, duration) 
    VALUES (?, 10000, 10000, 'Interest Only', 'Monthly', 5, ?, 12)
  `).run(borrowerId, new Date().toISOString().split('T')[0]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    try {
      const totalLent = db.prepare("SELECT SUM(given_amount) as total FROM loans WHERE direction = 'Lent'").get() as any;
      const totalBorrowed = db.prepare("SELECT SUM(given_amount) as total FROM loans WHERE direction = 'Borrowed'").get() as any;
      const totalCollected = db.prepare("SELECT SUM(amount) as total FROM payments p JOIN loans l ON p.loan_id = l.id WHERE l.direction = 'Lent'").get() as any;
      const activeBorrowers = db.prepare("SELECT COUNT(DISTINCT borrower_id) as count FROM loans WHERE status = 'Active' AND direction = 'Lent'").get() as any;
      const capital = db.prepare("SELECT amount FROM capital WHERE id = 1").get() as any;
      
      res.json({
        totalGiven: totalLent.total || 0,
        totalBorrowed: totalBorrowed.total || 0,
        totalCollected: totalCollected.total || 0,
        activeBorrowers: activeBorrowers.count || 0,
        investedCapital: capital.amount || 0
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Capital Management
  app.get("/api/capital", (req, res) => {
    const capital = db.prepare("SELECT amount FROM capital WHERE id = 1").get() as any;
    res.json(capital);
  });

  app.post("/api/capital", (req, res) => {
    const { amount } = req.body;
    db.prepare("UPDATE capital SET amount = ? WHERE id = 1").run(amount);
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
  app.get("/api/borrowers", (req, res) => {
    const borrowers = db.prepare("SELECT * FROM borrowers ORDER BY name ASC").all();
    res.json(borrowers);
  });

  app.post("/api/borrowers", (req, res) => {
    const { name, phone, address, notes } = req.body;
    const info = db.prepare("INSERT INTO borrowers (name, phone, address, notes) VALUES (?, ?, ?, ?)").run(name, phone, address, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/borrowers/:id", (req, res) => {
    const { name, phone, address, notes } = req.body;
    db.prepare("UPDATE borrowers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?").run(name, phone, address, notes, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/borrowers/:id", (req, res) => {
    db.prepare("DELETE FROM borrowers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Loans
  app.get("/api/loans", (req, res) => {
    const loans = db.prepare(`
      SELECT l.*, b.name as borrower_name 
      FROM loans l 
      JOIN borrowers b ON l.borrower_id = b.id 
      ORDER BY l.created_at DESC
    `).all();
    res.json(loans.map(l => getLoanSummary(l)));
  });

  app.get("/api/borrowers/:id/loans", (req, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE borrower_id = ?").all(req.params.id);
    res.json(loans.map(l => getLoanSummary(l)));
  });

  app.post("/api/loans", (req, res) => {
    const { borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration } = req.body;
    const info = db.prepare(`
      INSERT INTO loans (borrower_id, amount, given_amount, loan_type, direction, interest_type, interest_rate, installment_amount, start_date, duration) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(borrower_id, amount, given_amount, loan_type, direction || 'Lent', interest_type, interest_rate, installment_amount, start_date, duration);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/loans/:id", (req, res) => {
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
      WHERE id = ?
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
      req.params.id
    );
    res.json({ success: true });
  });

  // Payments
  app.get("/api/loans/:id/payments", (req, res) => {
    const payments = db.prepare("SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC").all(req.params.id);
    res.json(payments);
  });

  app.post("/api/payments", (req, res) => {
    const { loan_id, amount, payment_date, notes } = req.body;
    const info = db.prepare("INSERT INTO payments (loan_id, amount, payment_date, notes) VALUES (?, ?, ?, ?)").run(loan_id, amount, payment_date, notes);
    res.json({ id: info.lastInsertRowid });
  });

  // Reports
  app.get("/api/reports", (req, res) => {
    const loans = db.prepare(`
      SELECT l.*, b.name as borrower_name
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
    `).all();
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
