# AtomQuest Goal Setting & Tracking Portal

A comprehensive, digital Goal Setting & Tracking Portal built for the **ATOMQUEST HACKATHON 1.0**.

## 🚀 Architecture
- **Frontend & Backend**: Next.js (App Router)
- **Styling**: Pure CSS / CSS Modules with modern Glassmorphism aesthetics (no TailwindCSS as per guidelines).
- **Database**: Prisma ORM with SQLite (Easily swappable to PostgreSQL for production).
- **Authentication**: Custom Mock Auth Provider for seamless switching between Employee, Manager, and Admin roles during the hackathon demo.

## ✨ Features
### Phase 1: Goal Creation & Approval
- Employee interface to define goals, targets, and weightages.
- Hard validation logic (max 8 goals, min 10% weightage per goal, exactly 100% total weightage).
- Manager inline approval workflow.
- Secure goal locking after approval.

### Phase 2: Achievement Tracking
- Employee check-in interface filtered by quarterly time-windows.
- Manager team-progress dashboard to view achievements, compute scores, and add check-in comments.

### Phase 3: Reporting & Governance
- Admin dashboard showing real-time goal completion metrics.
- Exportable CSV reports of Planned vs. Actual achievements.
- Comprehensive System Audit Trail logging all goal modifications.

## 🛠️ Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Push the database schema and seed demo data:**
   ```bash
   npx prisma db push
   npx prisma generate
   node prisma/seed.js
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## 👤 Demo Personas
Use the dropdown in the top navigation bar to switch between the seeded personas:
- **Admin User**: Full system access, audit logs, CSV exports.
- **Manager User**: Approve goals and add quarterly check-in comments.
- **Employee User**: Create goals, assign weightages, and log actual achievements.
