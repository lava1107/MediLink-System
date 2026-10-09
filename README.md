# MediLink System – Unified Multi-Branch Pharmacy Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![OAuth 2.0](https://img.shields.io/badge/Auth-Google_OAuth_2.0_%26_JWT-4285F4.svg?logo=google)](https://developers.google.com/identity/protocols/oauth2)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**MediLink System** is an enterprise-grade full-stack multi-branch pharmacy and medical shop management platform built with **React 18**, **Node.js (Express)**, **MySQL**, and **Tailwind CSS**. Designed for multi-location healthcare operations across Kovilpatti, Tirunelveli, and Madurai, it unifies inventory control, POS billing with tax-compliant GST PDF invoices, batch expiry alerting, inter-branch stock rebalancing, and clinical drug safety gating.

---

## 🚀 Key System Features

1. **OAuth 2.0 & JWT Authentication**:
   - Native 1-click **Google OAuth 2.0** login with account chooser support.
   - RFC 7519 cryptographic **JWT** session tokens (HS256, 7-day expiry) injected into all authenticated API calls.
   - Preserved instant 1-click demo login credentials for rapid evaluation.

2. **Multi-Branch Operations & Role-Based Access Control (RBAC)**:
   - Centralized network oversight across **Kovilpatti Branch**, **Tirunelveli Branch**, and **Madurai Branch**.
   - Distinct role portals for **System Administrators** and **Pharmacists** with granular permission guards.

3. **Clinical Drug-Drug Interaction (DDI) Safety Engine**:
   - Real-time algorithmic check during POS dispensing that prevents toxic duplicate active ingredients and dangerous contraindications (e.g., fluoroquinolone-mineral chelation) with pharmacist clinical override gating.

4. **Point of Sale (POS) Billing & GST Tax Invoices**:
   - High-throughput billing interface with instant stock deduction.
   - Client-side and server-side PDF invoice generation (`jspdf` + `jspdf-autotable`) with GST breakdown, HSN codes, and pharmacy licensing metadata.

5. **Automated Expiry Medicine Alert System**:
   - Background cron scanner monitoring medicine batches expiring within 30, 15, and 7-day thresholds.
   - Real-time warning badges, quarantine actions, and automated email/SMS alerts to branch pharmacists.

6. **Omnichannel Communication Gateway**:
   - **Real Gmail SMTP integration** for customer receipts, supplier purchase orders, and OTP authentication.
   - **Twilio SMS service** for customer prescription ready notices and medicine reservation stock queue alerts.

7. **MediBot AI Pharmacy Assistant**:
   - Interactive floating assistant supporting live stock queries, generic alternative suggestions, and workflow shortcuts.

8. **Partner Medical Shop Network & Geo-Transfers**:
   - Inter-branch stock rebalancing with Haversine distance calculations and inventory lookup across 5 affiliated partner medical shops.

9. **Developer REST API Portal (`/api-access`)**:
   - Production API Key management (`X-API-Key`) with interactive endpoint explorer, live response latency inspector, and code generators (cURL, JavaScript, Python).

10. **Multilingual (i18n) Support**:
    - Instant reactive interface translation for **English (EN)**, **Tamil (தமிழ் - TA)**, **Hindi (हिन्दी - HI)**, and **Spanish (Español - ES)**.

---

## 📁 Repository Structure

```
MediLink-System/
├── backend/                             # Express.js REST API & MySQL Database
│   ├── database/
│   │   ├── schema.sql                   # Relational schema (tables, foreign keys, indexes)
│   │   ├── seed.sql                     # Seed data for branches, medicines, batches, users
│   │   └── setup.js                     # Automated database migration and setup script
│   ├── src/
│   │   ├── config/                      # Database pool & environment variable loaders
│   │   ├── controllers/                 # Request handlers for auth, inventory, sales, etc.
│   │   ├── middleware/                  # JWT authentication & RBAC authorization
│   │   ├── routes/                      # Modular Express route declarations
│   │   ├── services/                    # DDI safety, geo-location, email/SMS gateways
│   │   └── server.js                    # Express application entrypoint
│   ├── .env.example                     # Backend environment variable template
│   └── package.json                     # Backend dependencies & scripts
│
├── MediLink/                            # React 18 + Vite Frontend Application
│   ├── public/                          # Static assets and icons
│   ├── src/
│   │   ├── components/                  # UI components, layout, navbar, sidebar, MediBot
│   │   ├── context/                     # AuthContext, AppContext, LanguageContext, ThemeContext
│   │   ├── pages/                       # Dashboard, POS, Medicines, Batches, Partners, Settings
│   │   ├── services/                    # Axios/fetch API clients and fallback mocks
│   │   ├── utils/                       # PDF generation, branch utilities, DDI rules
│   │   ├── App.jsx                      # Route configurations & protected route guards
│   │   └── main.jsx                     # Vite React bootstrap
│   ├── .env.example                     # Frontend environment variable template
│   ├── vite.config.js                   # Vite configuration
│   └── package.json                     # Frontend dependencies & scripts
│
├── package.json                         # Monorepo workspace orchestrator
├── test_integration.js                  # Integration verification script
├── test_new_features.js                 # End-to-end verification script
├── verify_features.js                   # Feature check & invoice PDF generator test
└── .gitignore                           # Comprehensive git exclusions
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MySQL**: MySQL Server 8.0+ running on port `3306`

### 2. Environment Configuration

#### Backend Setup:
```bash
cd backend
copy .env.example .env
```
Edit `backend/.env` with your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=medilink
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
```

#### Frontend Setup:
```bash
cd ../MediLink
copy .env.example .env
```
Edit `MediLink/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Initialization
From the project root:
```bash
npm run setup
```
*(This executes `backend/database/setup.js`, creating tables and populating realistic multi-branch pharmacy data).*

### 4. Running the Application
From the project root, launch both frontend and backend concurrently:
```bash
npm run dev
```

Alternatively, run each service individually:
- **Frontend only**: `npm run dev:frontend` (available at `http://localhost:5173`)
- **Backend only**: `npm run dev:backend` (API listening on `http://localhost:5000`)

---

## 👥 Verified Test Credentials

The database comes pre-seeded with 7 active test accounts across all 3 branches:

| Name | Role | Branch | Username | Password |
|---|---|---|---|---|
| **Lavanya M** | Admin (System Superuser) | Kovilpatti Branch | `lavanya.admin` | `admin123` |
| **Dr. Sundar Raj** | Admin | Tirunelveli Branch | `sundar.admin` | `admin123` |
| **Rajan Pillai** | Senior Pharmacist | Kovilpatti Branch | `rajan.pharmacist` | `pharma123` |
| **Meenakshi Sundaram** | Pharmacist | Kovilpatti Branch | `meenakshi.ph` | `pharma123` |
| **Arun Kumar** | Pharmacist | Tirunelveli Branch | `arunkumar.ph` | `pharma123` |
| **Divya Bharathi** | Pharmacist | Tirunelveli Branch | `divya.ph` | `pharma123` |
| **Bhuvana Chandran** | Pharmacist | Madurai Branch | `bhuvana.ph` | `pharma123` |

*Tip: The login screen includes 1-click credential auto-fill buttons for each role.*

---

## 🧪 Automated Testing & Verification

Run the end-to-end and integration verification suites against the running services:

```bash
# Verify authentication, health checks, and PDF invoice generation
node verify_features.js

# Test all 7 login accounts, Google OAuth token exchange, and DDI checks
node test_integration.js

# End-to-end verification across partner shop inventory and stock alerts
node test_new_features.js
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
