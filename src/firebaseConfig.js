import { initializeApp, firebase } from "firebase/app";
import "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



// const firebaseConfig = {
//   apiKey: "AIzaSyApgf553yc27_FU6xjXZigMdEhIkBZGydQ",
//   authDomain: "projecttimesheet-6110e.firebaseapp.com",
//   projectId: "projecttimesheet-6110e",
//   storageBucket: "projecttimesheet-6110e.firebasestorage.app",
//   messagingSenderId: "791246146367",
//   appId: "1:791246146367:web:36e0bd27c05e191ba4a18a",
//   measurementId: "G-X4K96GD6LY",
// };

// firebaseConfig.js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY || "AIzaSyApgf553yc27_FU6xjXZigMdEhIkBZGydQ",
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || "projecttimesheet-6110e.firebaseapp.com",
  projectId: process.env.REACT_APP_PROJECT_ID || "projecttimesheet-6110e",
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET || "projecttimesheet-6110e.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID || "791246146367",
  appId: process.env.REACT_APP_APP_ID || "1:791246146367:web:36e0bd27c05e191ba4a18a"
};



// Initialize Firebase only if it hasn't been initialized already
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firestore
export const firestore = getFirestore(app);


export default app;



