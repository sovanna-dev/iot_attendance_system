/*
 * ==========================================================
 *  FIREBASE CONFIGURATION - TEMPLATE
 *  Copy to firebase-config.js and add your keys
 * ==========================================================
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    projectId: "YOUR_PROJECT_ID_HERE"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

db.enablePersistence()
    .then(() => console.log('✅ Offline enabled'))
    .catch((err) => console.warn('⚠️', err));

console.log('✅ Firestore initialized');