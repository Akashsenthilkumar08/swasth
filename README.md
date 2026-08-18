# CareConnect Kerala – Hackathon Prototype
## Digital Health Record & AI Support System for Migrant Workers

> SDG 3 – Good Health and Well-being

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed

### Step 1: Start Backend
```powershell
cd Medicare\backend
npm install           # (already done)
node server.js        # Starts on http://localhost:3001
```

### Step 2: Open Frontend
Open `Medicare\frontend\index.html` in your browser.
- Or use VS Code Live Server on port 5500.

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👤 Migrant Worker | worker@careconnect.demo | Worker@123 |
| 🏥 Healthcare Provider | doctor@careconnect.demo | Doctor@123 |
| ⚙️ Admin | admin@careconnect.demo | Admin@123 |

---

## 📋 Demo Flow (3-5 minutes)

1. Open `index.html` — Landing page
2. Click **"Login as Worker"** → `worker@careconnect.demo / Worker@123`
3. View **Health Record** → Visits, Vaccinations, Medications, Lab Reports
4. Open **Emergency QR Card** → See limited emergency info
5. Open **AI Assistant** → Ask: _"I am new to Kochi. Where is the nearest hospital?"_
6. See nearby hospitals → Ask: _"What healthy food can I find under ₹150?"_
7. Ask: _"Show my vaccination record"_ → Chatbot fetches from DB
8. Go to **Medicine Reminders** → Set a new reminder
9. Logout → Login as **Doctor** (`doctor@careconnect.demo / Doctor@123`)
10. Search "Arun Kumar" → View authorized health record
11. Add a consultation record
12. View **Audit Log**
13. Logout → Login as **Admin** (`admin@careconnect.demo / Admin@123`)
14. View analytics charts and system overview

---

## 🏗️ Architecture

```
Medicare/
├── backend/                    # Node.js + Express + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── seed.js            # Demo data
│   ├── src/
│   │   ├── middleware/auth.js  # JWT + role auth + audit
│   │   └── routes/            # API routes
│   ├── .env                   # Environment config
│   └── server.js              # Express entry point
└── frontend/                  # Vanilla HTML/CSS/JS
    ├── index.html             # Landing page
    ├── login.html             # Auth
    ├── worker-dashboard.html  # Worker portal (ALL features)
    ├── provider-dashboard.html # Doctor portal
    ├── admin-dashboard.html   # Admin analytics
    └── css/styles.css         # Premium design system
```

---

## ✅ Feature Checklist

- [x] Landing page with hero, features, demo accounts
- [x] JWT authentication with role-based access
- [x] Password hashing (bcrypt)
- [x] Migrant worker profile & dashboard
- [x] Digital health record (visits, vaccines, meds, reports)
- [x] Health Documents (Upload PDF, JPG, PNG with drag-and-drop & in-browser preview)
- [x] Emergency QR health card (limited info only)
- [x] AI multilingual chatbot (8 intents: EN/TA/ML/HI)
- [x] Nearby healthcare finder (4 districts)
- [x] Food assistant (filter by veg/price/location)
- [x] Medicine reminders (CRUD)
- [x] Healthcare provider dashboard
- [x] Doctor can add consultations + upload reports
- [x] Admin analytics with Chart.js charts
- [x] Audit logging (all record access tracked)
- [x] Responsive design
- [x] Demo data seeded

---

## ⚠️ Important Notes

- All data is **demo/sample data** for hackathon purposes
- The AI assistant does NOT diagnose or prescribe medicines
- Food suggestions are general, not medical dietary advice
- For real emergencies: Call **108** (Kerala Ambulance)
