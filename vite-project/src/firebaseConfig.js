import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAahtJRdGZeSjHkpN66SoTrzIv6wOObU7E",
    authDomain: "juego4-raya.firebaseapp.com",
    projectId: "juego4-raya",
    storageBucket: "juego4-raya.firebasestorage.app",
    messagingSenderId: "504028346264",
    appId: "1:504028346264:web:70d13d89399008b5275ded"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
