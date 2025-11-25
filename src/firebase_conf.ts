
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDT2yOU36LV6oTJwI65j7qx9IrmUdhXsgY",
    authDomain: "p2-502-402.firebaseapp.com",
    projectId: "p2-502-402",
    storageBucket: "p2-502-402.firebasestorage.app",
    messagingSenderId: "414378086538",
    appId: "1:414378086538:web:441ce74554f29340f45d73"
};

// Initialize Firebase
// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp)
export const googleAuthProvider = new GoogleAuthProvider()