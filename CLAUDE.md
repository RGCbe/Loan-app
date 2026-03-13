# LendTrack Project Brain (CLAUDE.md)

This file serves as the persistent memory and guide for Claude Code while working on the LendTrack project.

## 🛠 Project Stack
*   **Backend**: Node.js, Express, TypeScript, `better-sqlite3`.
*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Three.js (Fiber).
*   **Database**: SQLite (`loans.db`).
*   **Mobile**: Ionic Capacitor (Android support enabled).

## 🚀 Key Commands
*   **Development**: `npm run dev` (Starts backend with `tsx`)
*   **Build**: `npm run build` (Vite build)
*   **Lint**: `npm run lint` (TypeScript check)
*   **Mobile Sync**: `npm run cap:sync`
*   **Claude Update**: `cu` (Updates CLI, Plugins, and Tech Context)

## 🎨 Coding Standards & Patterns
*   **Components**: Use functional React components with hooks.
*   **Styling**: Use Tailwind CSS for all UI elements.
*   **Security**: Authenticated routes using JWT. Rate limiting active on auth endpoints.
*   **Database**: All database calls use `better-sqlite3` prepared statements.
*   **Responsiveness**: Mobile-first design is a priority (Capacitor target).

## 📂 Architecture Note
*   `server.ts`: Monolithic Express entry point handling both API and Vite dev server.
*   `src/App.tsx`: Main frontend orchestration.
*   `loans.db`: SQLite file in project root.

---
## 👑 Master Skill
*   **Persona**: This project is governed by the [FULL_STACK_SKILL.md](file:///f:/Loan%20app/Loan-app/FULL_STACK_SKILL.md) instructions. Always adhere to the "A-to-Z Full Stack" persona for every task.
*   **Mindset**: **Autonomous R&D**. If a user provides a brief request, expand it into a full project lifecycle (0 to 100). Identify and implement all missing details proactively.

## 👥 Sub-Agent Strategy (Orchestration)
For complex tasks (e.g., "Build a multi-page dashboard"), Claude should:
1.  **Spawn a Manager**: Use a sub-agent to coordinate the project graph.
2.  **Parallel Tasks**: Delegate frontend components to one agent and backend logic to another.
3.  **Cross-Verify**: Use a third "Senior Auditor" agent to review all merged changes for security and style compliance.

## 🔄 Self-Correction Loop
*   **Error Memory**: Refer to [LEARNINGS.md](file:///f:/Loan app/Loan-app/LEARNINGS.md) before every task to avoid repeated mistakes.
*   **Post-Failure Audit**: After any command failure, perform a root-cause analysis and update the Learning Log.

## 🌐 Ever-Learning (Global Sync)
*   **Daily Tech Check**: Refer to [TECH_PULSE.md](file:///f:/Loan app/Loan-app/TECH_PULSE.md).
*   **Proactive Modernization**: Always check for new documentation and library updates before implementing major features via Search MCP.

---
*Created for Claude Code optimized workflows.*
