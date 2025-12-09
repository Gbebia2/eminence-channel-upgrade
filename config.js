// ===================================
// FIREBASE CONFIGURATION & INITIALIZATION (Duplicate Check Added)
// ===================================

// Check if the Firebase App has ALREADY been initialized to prevent the
// common 'Firebase App named [DEFAULT] already exists' error.

if (!firebase.apps.length) {

    // --- Your Original Firebase Configuration Keys ---
    const firebaseConfig = {
        apiKey: "AIzaSyAi4qhZn0z5Crsx3MrBTQT6osv-Mjtnwpw",
        authDomain: "eminence-channel-ministries.firebaseapp.com",
        projectId: "eminence-channel-ministries",
        storageBucket: "eminence-channel-ministries.firebasestorage.app",
        messagingSenderId: "1040896099544",
        appId: "1:1040896099544:web:a635085d369d644df6c3ad"
    };

    // 1. Initialize Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase App initialized successfully.");

        // 2. Initialize Firestore Database and make it globally available
        window.db = firebase.firestore();
        console.log("Firestore Database connected and assigned to window.db.");

    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
}