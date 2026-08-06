import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };