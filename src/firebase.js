import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBEtQr19WTjSTxssB2TjJq-ENioG8Jpq6Q",
  authDomain: "dxb-analytics.firebaseapp.com",
  projectId: "dxb-analytics",
  storageBucket: "dxb-analytics.firebasestorage.app",
  messagingSenderId: "329487314073",
  appId: "1:329487314073:web:2a73aa4a5b770f58459c08",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
