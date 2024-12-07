import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyApgf553yc27_FU6xjXZigMdEhIkBZGydQ",
  authDomain: "projecttimesheet-6110e.firebaseapp.com",
  projectId: "projecttimesheet-6110e",
  storageBucket: "projecttimesheet-6110e.firebasestorage.app",
  messagingSenderId: "791246146367",
  appId: "1:791246146367:web:36e0bd27c05e191ba4a18a",
  measurementId: "G-X4K96GD6LY",
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export default app;



