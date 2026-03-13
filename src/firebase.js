import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyA4OBfvJELzVzSAv-y7HTIDr8jazIXM0KU",
    authDomain: "divina-pro.firebaseapp.com",
    projectId: "divina-pro",
    storageBucket: "divina-pro.firebasestorage.app",
    messagingSenderId: "854521776594",
    appId: "1:854521776594:web:5dee5979ebc7e1d79ee00b",
    measurementId: "G-GFJ7HBDV02"
  };


 // Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);