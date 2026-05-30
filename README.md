---

## 🔐 Security Setup

### Before Publishing to GitHub:

1. **This project uses `.gitignore` to protect API keys**

2. **The real `firebase-config.js` is NOT uploaded to GitHub**

3. **Users must create their own config file**

---

## 🚀 Quick Start Guide

### For New Users:

1. **Clone or download this project**

2. **Navigate to the `js` folder:**
attendance-dashboard/js/

text

3. **Copy the template file:**
firebase-config.example.js → firebase-config.js

text

4. **Edit `firebase-config.js` with YOUR Firebase details:**

```javascript
const firebaseConfig = {
    apiKey: "YOUR_REAL_API_KEY",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com/",
    projectId: "YOUR_PROJECT_ID"
};
Get your Firebase details from:

Go to Firebase Console

Select your project

Click ⚙️ → Project Settings → General

Copy "Web API Key"

Open index.html in your browser

Register an account and start using!