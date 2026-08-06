// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hireprep-ai-bacbf.firebaseapp.com",
  projectId: "hireprep-ai-bacbf",
  storageBucket: "hireprep-ai-bacbf.firebasestorage.app",
  messagingSenderId: "76611303727",
  appId: "1:76611303727:web:448d1d913c30549dd989da",
  measurementId: "G-L66S08YZQ3"
};

const app = initializeApp(firebaseConfig);

const auth =getAuth(app);


const provider = new GoogleAuthProvider()

export{auth, provider}


