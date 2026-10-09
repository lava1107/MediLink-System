# MediLink – Medical Shop Management System

A multi-branch pharmacy / medical shop management web application built with **React.js**, **JavaScript (JSX)**, **React Router**, **Context API**, and **Tailwind CSS**, created as a Modern Web Technologies (MWT) EL project.

## Tech Stack

- React 18 + Vite
- React Router v6 (client-side routing, protected/role-based routes)
- Context API (`AuthContext`, `AppContext`) for auth and shared app state
- Tailwind CSS for styling
- Recharts for dashboard charts
- lucide-react for icons
- Mock, REST-ready service layer (`src/services`) using in-memory data — structured so it can later call a Node.js + Express + MongoDB backend

## Getting Started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Demo Login

On the login screen, use the **Quick Demo Login** buttons, or sign in manually:

| Role       | Username        | Password (any value works in this mock build) |
|------------|-----------------|-------------------------------------------------|
| Admin      | `lavanya.admin` | anything |
| Pharmacist | `rajan.pharmacist`  | anything |

## Project Structure

```
MediLink/
├── package.json
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx              # App entry point, wraps App in BrowserRouter
│   ├── App.jsx                # Route definitions
│   ├── index.css              # Tailwind directives + global styles
│   ├── components/
│   │   ├── common/            # StatCard, StatusBadge, Modal, FormInput, Btn, etc.
│   │   ├── tables/            # Generic DataTable (search/filter/sort/paginate)
│   │   └── layout/             # Sidebar, Navbar
│   ├── layouts/
│   │   └── AppLayout.jsx      # Sidebar + Navbar + <Outlet /> shell
│   ├── pages/                 # One folder per module (dashboard, medicines, sales, ...)
│   ├── context/
│   │   ├── AuthContext.jsx    # login/logout, current user, role
│   │   └── AppContext.jsx     # shared mock "database", notifications, toasts
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useApp.js
│   ├── services/              # API-ready service functions (medicineService, salesService, ...)
│   ├── data/
│   │   └── mockData.js        # Realistic Indian-pharmacy mock dataset
│   └── utils/
│       ├── theme.js           # Design tokens (colors)
│       └── format.js          # formatCurrency, formatDate, helpers
```

## Notes

- All data is in-memory mock data (`src/data/mockData.js`) held in `AppContext`. Actions like generating a sale, creating a purchase, or confirming a reservation update this shared state, so the dashboard and lists reflect changes immediately.
- The `services/` layer is written as plain async functions that currently resolve from mock data, but are shaped like REST calls (`getX`, `createX`, `updateX`) so swapping in `fetch`/`axios` calls to a real Express API later is a drop-in change.
- Role-based route protection is implemented in `src/routes` — Pharmacist accounts are redirected away from Users/Branches/Categories.
