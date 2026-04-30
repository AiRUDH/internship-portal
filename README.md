# MySock Web Portal

A modern, responsive web portal with Firebase backend and admin dashboard.

## Setup

### 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named `mysock`
3. Enable **Firestore Database** (start in production mode)
4. Enable **Authentication** → Email/Password provider
5. Create your admin user under Authentication → Users

### 2. Get Firebase Config
In Firebase Console → Project Settings → Your Apps → Add Web App.
Copy the config object and paste it into `firebase.js`:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Apply Firestore Rules
In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules`.

### 4. Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to Settings → Pages → Source: `main` branch, `/ (root)`
3. Your site will be live at `https://yourusername.github.io/repo-name/`

> Note: GitHub Pages serves static files. Firebase runs entirely client-side, so no server is needed.

## File Structure

```
index.html      — Home page (hero, about, services, contact form)
listings.html   — Public listings with search/filter
admin.html      — Admin dashboard (protected)
login.html      — Admin login page
firebase.js     — Firebase initialization & exports
script.js       — All page logic
style.css       — All styles
firestore.rules — Firestore security rules
```

## Features
- Firebase Authentication (admin only)
- Firestore CRUD for listings and applications
- Real-time listings on public pages
- Admin dashboard with stats, add/edit/delete listings
- Contact/apply form stores to Firestore
- Fully responsive, mobile-friendly
