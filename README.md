# TaskLapse - Smart Expiry, Renewal & Task Tracker

[![Version](https://img.shields.io/badge/version-2.9.9-indigo.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

TaskLapse is a modern, responsive personal productivity web application built for tracking expiration dates, renewal cycles, vehicle maintenance, licenses, subscriptions, and recurring commitments.

---

## ✨ Features

- **🎯 Urgency Kanban Board**:
  - Automatically sorts active commitments into **DUE IN DAYS** (≤7 days), **DUE IN WEEKS** (8–31 days), and **DUE IN MONTHS** (>31 days).
  - High-visibility urgency badges: *Expires Today*, *1d left*, *Nd left*, and future status.

- **📅 Target Start & Expiration Logic**:
  - **Target Start Date**: Required baseline date for effective scheduling. Future-dated tasks are held safely until their start date.
  - **Expires Date (Optional)**: Set a hard cutoff date for recurring commitments (e.g., fixed-term contracts, lease agreements). Recurring tasks will not regenerate once this cutoff is reached.
  - **Clean Card Presentation**: Item cards display only category, status, title, notes, and recurrence definition without cluttering details.

- **🔄 Intelligent Recurrence Engine**:
  - Check off items to archive the completed cycle while rolling the next active period forward according to schedule:
    - *Every Week*
    - *Every 1 Month*
    - *Every 3 Months*
    - *Every 6 Months*
    - *Every 1 Year*
    - *Every 2 Years*
  - Automatically avoids past-due traps with continuous roll-forward.

- **🔔 Automated Alarm Simulation & Webhooks**:
  - Daily notification simulation evaluates items against custom alert preferences (**30 days**, **7 days**, and **1 day or less**).
  - Outbound JSON webhook dispatch to **Make.com**, **Zapier**, or custom automation endpoints.
  - Real-time pipeline delivery telemetry log (`Success 200`, `Delivery Failed`, timestamps).

- **🗂️ Dynamic Category Manager**:
  - Create, customize, and reorder categories with color themes and emojis.
  - Drag-and-drop category reordering.
  - Horizontal drag-to-scroll filter bar for rapid filtering.

- **💾 Dual Storage Drivers & Offline Backups**:
  - **Guest Mode**: 100% offline-ready, persisted to browser `localStorage`.
  - **Cloud Mode**: Real-time multi-device synchronization via Firebase Authentication & Firestore.
  - **Offline JSON Portability**: One-click JSON backup export (`tasklapse_backup_YYYY-MM-DD.json`) and import with support for "Merge" and "Replace all" modes. Ensure an offline copy of all your commitments is always at hand.

- **📱 Pixel-Perfect Responsive Design**:
  - Engineered for zero overlapping from compact 320px mobile screens to large desktop monitors.
  - Mobile search sheet, touch-friendly tap targets, and adaptive action buttons.

- **🗑️ Safe Archive Management**:
  - Comprehensive history with category tagging and search.
  - Permanent removal of individual records with two-step confirmation.
  - One-click "Clear All Archives" bulk purge.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Firebase v12](https://firebase.google.com/) (Firestore & Auth)
- **State Management**: React Context API with persistent drivers

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/tasklapse.git
   cd tasklapse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* If you wish to use Firebase cloud synchronization, provide your Firebase project credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
   *Note: If no Firebase keys are set, TaskLapse operates seamlessly in Guest (Local Storage) mode.*

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Deployment

To create an optimized production bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

The output files will be located in the `dist/` directory, ready to be deployed to any static host (Vercel, Cloudflare Pages, Netlify, Firebase Hosting, GitHub Pages).

---

## 📡 Webhook Integration Schema

When the Daily Alarm is simulated and alert criteria match, TaskLapse dispatches a POST request for each triggered item to your configured webhook URL with the following JSON schema:

```json
{
  "event": "tasklapse_alerts",
  "item": "Driver's License Renewal",
  "daysRemaining": 7,
  "targetStartDate": "2026-10-10",
  "expiresDate": "2026-10-10",
  "notes": "Renew at downtown DMV branch",
  "category": "Personal",
  "driverMode": "cloud_sync",
  "user": "user@example.com",
  "auth_secret": "my_secure_token",
  "timestamp": "2026-10-03T12:00:00.000Z"
}
```

---

## 💬 Support & Contact

Have questions, found a bug, or want to suggest a new feature?
- **Email**: [support@tasklapse.app](mailto:support@tasklapse.app)
- **Feature Requests & Bug Reports**: Submit inquiries via the in-app **About & Support** dialog or by emailing support directly with your environment details.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
