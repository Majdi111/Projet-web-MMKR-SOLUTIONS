// /lib/firebaseClient.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCyKsO-2URhp5QqKFhK-ExL_IgpdjXIdPA",
  authDomain: "exemple-b1d25.firebaseapp.com",
  projectId: "exemple-b1d25",
  storageBucket: "exemple-b1d25.firebasestorage.app",
  messagingSenderId: "386301045495",
  appId: "1:386301045495:web:41d2bfe85f0e48cd8501f2"
}


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);