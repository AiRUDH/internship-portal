# MySock Internship Portal

A production-ready internship management platform with Firebase backend, admin dashboard, and real-time application tracking.

## Features

✅ **Public Internship Listings** — Real-time display with search functionality  
✅ **Application System** — Students can apply with resume links  
✅ **Admin Dashboard** — Secure UID-locked admin panel  
✅ **Status Management** — Track applications (Pending/Selected/Rejected)  
✅ **Firebase Backend** — Firestore + Authentication  
✅ **GitHub Pages Ready** — No build step required  

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable **Firestore Database** (production mode)
3. Enable **Authentication** → Email/Password provider
4. Create admin user in Authentication → Users (copy the UID)
5. Get your Firebase config from Project Settings → Web App

### 2. Update Configuration Files

**firebase.js** — Replace placeholder config:
```js
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abc123"
};
```

**script.js** — Update admin UID (line 10):
```js
const ADMIN_UID = "YOUR_ADMIN_USER_UID_FROM_FIREBASE";
```

**firestore.rules** — Update UID in rules (lines 9 & 16):
```
allow write: if request.auth != null &&
             request.auth.uid == "YOUR_ADMIN_USER_UID";
```

### 3. Deploy Firestore Rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules` and publish.

### 4. Deploy to GitHub Pages

```bash
git add .
git commit -m "Deploy internship portal"
git push origin main
```

Enable GitHub Pages: Settings → Pages → Source: `main` branch, `/internship-portal` folder

## File Structure

```
index.html       — Public internship listings
apply.html       — Application form
login.html       — Admin login
admin.html       — Admin dashboard (protected)
firebase.js      — Firebase initialization
script.js        — All application logic
style.css        — Complete styling
firestore.rules  — Security rules
```

## Security Features

🔒 **UID-Based Access Control** — Only specific admin UID can access dashboard  
🔒 **Flicker Prevention** — Auth check completes before UI renders  
🔒 **Firestore Rules** — Server-side security enforcement  
🔒 **Input Validation** — Client-side form validation with error messages  

## Database Schema

### Collection: `internships`
```js
{
  title: string,
  description: string,
  duration: string,
  createdAt: timestamp
}
```

### Collection: `applications`
```js
{
  name: string,
  email: string,
  phone: string,
  resume: string (URL),
  status: "pending" | "selected" | "rejected",
  createdAt: timestamp
}
```

## Admin Features

- Add/delete internships
- View all applications
- Update application status with live dropdown
- Real-time statistics
- Responsive mobile design

## Testing Checklist

- [ ] Replace Firebase config with real values
- [ ] Update ADMIN_UID in script.js
- [ ] Update UID in firestore.rules
- [ ] Publish Firestore rules
- [ ] Create admin user in Firebase Auth
- [ ] Test login with admin credentials
- [ ] Add test internship from admin panel
- [ ] Submit test application from public form
- [ ] Update application status in admin panel
- [ ] Test delete functionality
- [ ] Verify unauthorized users cannot access admin

## Production Optimizations

✅ Error handling on all Firebase operations  
✅ Loading states for all async operations  
✅ Empty states for zero-data scenarios  
✅ Status update locking (prevents concurrent updates)  
✅ Rollback on failed status updates  
✅ Consistent data defaults (status: "pending")  
✅ Ordered queries for performance  
✅ User-friendly error messages  

## Support

For issues or questions, check:
- Firebase Console for auth/database errors
- Browser console for JavaScript errors
- Firestore rules for permission issues

---

**Built with:** HTML, CSS, JavaScript, Firebase  
**Hosting:** GitHub Pages  
**License:** MIT
