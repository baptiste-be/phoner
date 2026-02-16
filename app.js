// app.js
// Fichier central Firebase + fonctions communes

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// CONFIG FIREBASE À REMPLACER PAR LA TIENNE
const firebaseConfig = {
  apiKey: "TA_CLE_API",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJET",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Génère un numéro Phone au format XX-XX-XX-XX-XX (chiffres uniquement)
function generatePhoneNumber(uid) {
  let numeric = "";

  for (let i = 0; i < uid.length; i++) {
    numeric += (uid.charCodeAt(i) % 10).toString();
  }

  numeric = numeric.substring(0, 10).padEnd(10, "0");

  return (
    numeric.substring(0, 2) + "-" +
    numeric.substring(2, 4) + "-" +
    numeric.substring(4, 6) + "-" +
    numeric.substring(6, 8) + "-" +
    numeric.substring(8, 10)
  );
}

// Vérifie l’authentification + crée le numéro si absent
async function checkAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!location.pathname.endsWith("login.html")) {
          window.location.href = "login.html";
        }
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const phoneNumber = generatePhoneNumber(user.uid);
        await setDoc(userRef, {
          email: user.email,
          phoneNumber
        });
      } else {
        const data = snap.data();
        if (!data.phoneNumber) {
          const phoneNumber = generatePhoneNumber(user.uid);
          await setDoc(userRef, {
            ...data,
            phoneNumber
          });
        }
      }

      resolve(user);
    });
  });
}

// Déconnexion
async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

// Soumission formulaire login / register
async function submitForm(mode) {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("errorBox");

  if (!emailInput || !passwordInput || !errorBox) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  errorBox.textContent = "";

  if (!email || !password) {
    errorBox.textContent = "Email et mot de passe requis.";
    return;
  }

  try {
    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const phoneNumber = generatePhoneNumber(uid);

      await setDoc(doc(db, "users", uid), {
        email,
        phoneNumber
      });
    }
    window.location.href = "index.html";
  } catch (err) {
    errorBox.textContent = err.message || "Erreur d’authentification.";
  }
}

// Bascule login / création
function toggleMode() {
  const modeInput = document.getElementById("mode");
  const title = document.getElementById("loginTitle");
  const submitBtn = document.getElementById("submitBtn");
  const toggleLink = document.getElementById("toggleLink");
  const errorBox = document.getElementById("errorBox");

  if (!modeInput || !title || !submitBtn || !toggleLink) return;

  errorBox.textContent = "";

  if (modeInput.value === "login") {
    modeInput.value = "register";
    title.textContent = "Créer un compte Phone";
    submitBtn.textContent = "Créer un compte";
    toggleLink.textContent = "Déjà un compte ? Se connecter";
  } else {
    modeInput.value = "login";
    title.textContent = "Connexion Phone";
    submitBtn.textContent = "Connexion";
    toggleLink.textContent = "Pas de compte ? Créer un compte";
  }
}

export {
  auth,
  db,
  checkAuth,
  logout,
  submitForm,
  toggleMode,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  doc,
  setDoc,
  getDoc
};
