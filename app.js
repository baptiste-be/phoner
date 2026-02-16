import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Ta config Firebase (à remplacer par la tienne)
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Génération du numéro Phone® (Format XX-XX-XX-XX-XX)
function generatePhoneNumber(uid) {
    // On transforme l'UID en une suite de chiffres basée sur les codes ASCII
    let nums = uid.split('').map(char => char.charCodeAt(0)).join('').substring(0, 10);
    // On complète si c'est trop court
    while(nums.length < 10) nums += Math.floor(Math.random() * 10);
    // Formatage
    return nums.match(/.{1,2}/g).join('-');
}

// 3. Vérification de l'Auth
export async function checkAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                const newNumber = generatePhoneNumber(user.uid);
                await setDoc(userRef, {
                    email: user.email,
                    phoneNumber: newNumber
                });
            }
        }
    });
}

// Export des outils pour les autres fichiers
export { auth, db, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy, signOut };
