# LendTrack: Learning & Improvement Log

This file contains a record of past mistakes, edge cases found, and architectural lessons learned by Claude. Always read this file before performing R&D to avoid repeating errors.

## 📝 Recent Learnings
*   **[2026-03-13] Financial Precision**: Discovered that relying on `REAL` for currency can lead to rounding errors over long-term interest accrual. Future schemas must use `INTEGER` (cents).

## ⚠️ Avoid These Mistakes
1.  **PowerShell Redirection**: Avoid complex nested piping that strips color codes or hangs the shell.
2.  **JWT Expiration**: Ensure the `JWT_SECRET` is always consistent between server restarts (use `.env`).
3.  **SQLite Locking**: Be careful with concurrent writes; use prepared statements to avoid "Database is locked" errors.

---
*Self-learning initiated on 2026-03-13.*
