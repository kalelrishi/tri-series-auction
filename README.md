# 🏏 Tri Series Auction

> **A real-time cricket auction platform built with Next.js, Firebase, and TypeScript.**
>
> Manage players, teams, auctions, and live bidding with separate Admin and Captain experiences.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

Tri Series Auction is a complete **real-time cricket auction management system** designed for local tournaments, college events, and cricket leagues.

The application allows an **Admin (Auctioneer)** to manage players, teams, and auctions while multiple **Captains** participate simultaneously using secure access codes.

The entire auction updates in real time using **Firebase Firestore**, ensuring every participant sees live bidding, player nominations, and auction results instantly.

---

## ✨ Features

### 👑 Admin

- Secure Firebase Authentication
- Player Management
- Team Management
- Auction Management
- Live Auction Dashboard
- Player Nomination
- Start / Continue Auction
- Sold / Unsold Actions
- Auction Reset (Development)
- Auction History
- Reports

---

### 🏏 Captain

- Secure Access Code Login
- Team Dashboard
- Live Auction View
- Real-time Bidding
- Budget Tracking
- Read-only Team Information

---

### ⚡ Live Auction

- Real-time Firestore Synchronization
- Automatic Player Nomination
- Fixed Bid Increment
- Budget Validation
- Highest Bidder Tracking
- Sold & Unsold Flow
- Automatic Next Player
- Auction Completion
- Live Bid Activity

---

### 📊 Reports

- Sold Players
- Unsold Players
- Team Squads
- Remaining Budget
- Spending Summary
- Auction History

---

## 🛠 Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Firebase Firestore
- Firebase Authentication

### State Management

- React Hooks
- Firebase Realtime Listeners

### Validation

- Zod

---

# 🏗 Architecture

```
                    Firebase

        ┌──────────────────────────┐
        │ Authentication           │
        │ Firestore Database       │
        └─────────────┬────────────┘
                      │
              Real-time Updates
                      │
        ┌─────────────▼────────────┐
        │      Next.js App         │
        └─────────────┬────────────┘
                      │
      ┌───────────────┴────────────────┐
      │                                │
┌─────▼─────┐                    ┌─────▼─────┐
│   Admin   │                    │ Captain   │
└───────────┘                    └───────────┘
```

---

# 📂 Project Structure

```
app/
components/
services/
lib/
types/
utils/
public/
```

The project follows a **service-layer architecture**.

All Firestore operations are isolated inside the `services/` directory.

---

# 🔐 Authentication

## Admin

Uses **Firebase Authentication**.

Permissions:

- Full access
- Player Management
- Team Management
- Auctions
- Live Auction Controls
- Reports

---

## Captain

Uses automatically generated **Access Codes**.

Example:

```
TSA-9X4K2P
```

Captains can:

- Login
- View their Team
- Participate in Live Auction
- Place Bids

---

# 🔥 Auction Flow

```
Create Players
        │
        ▼
Create Auction
        │
        ▼
Create Teams
        │
        ▼
Start Auction
        │
        ▼
Nominate Player
        │
        ▼
Live Bidding
        │
        ▼
Sold / Unsold
        │
        ▼
Next Player
        │
        ▼
Auction Complete
        │
        ▼
Reports & History
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/tri-series-auction.git
```

Go into the project

```bash
cd tri-series-auction
```

Install dependencies

```bash
npm install
```

Create your environment file

```bash
cp .env.example .env.local
```

Run the development server

```bash
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

# 🧪 Available Scripts

```bash
npm run dev
npm run build
npm run lint
```

---

# 📸 Screenshots

Add screenshots here after completing the UI redesign.

Suggested screenshots:

- Login
- Dashboard
- Player Management
- Team Management
- Auction Dashboard
- Live Auction
- Captain Dashboard
- History

---

# 🎯 Future Improvements

- Mobile Application
- Auction Timer
- Voice Announcements
- Player Images
- Statistics Dashboard
- Dark / Light Theme
- Export PDF Reports
- Keyboard Shortcuts
- Push Notifications

---

# 👨‍💻 Author

**Hrushikesh Eluru**

Cyber Security Engineering Student

Built with ❤️ using Next.js, Firebase, and TypeScript.

---

# 📄 License

This project is licensed under the MIT License.

---

## ⭐ If you like this project

Give the repository a ⭐ on GitHub.

It helps a lot!
