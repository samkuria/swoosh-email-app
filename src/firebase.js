// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgY6S4vHFRjtLpVfXDaVa2pEO-KQBrXt0",
  authDomain: "swoosh-fa2e3.firebaseapp.com",
  projectId: "swoosh-fa2e3",
  storageBucket: "swoosh-fa2e3.firebasestorage.app",
  messagingSenderId: "346531305108",
  appId: "1:346531305108:web:5a9084699820d682b04681",
  databaseURL: "https://swoosh-fa2e3-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);