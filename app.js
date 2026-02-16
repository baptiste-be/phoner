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

// Remplace par ta vraie config Firebase
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "TON_PROJET.firebaseapp.com",
  projectId: "TON_PROJECT_ID",
  storageBucket: "TON_PROJET.appspot.com",
  messagingSenderId: "TON_SENDER_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Génération simple d’un numéro Phone® unique
function generatePhoneNumber(uid) {
  const base = uid.replace(/[^0-9a-z]/gi, "").slice(0, 8).padEnd(8, "0");
  return "+990" + base;
}

// Vérifie l’authentification et redirige si nécessaire
function checkAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (!location.pathname.endsWith("login.html")) {
          window.location.href = "login.html";
        }
      } else {
        resolve(user);
      }
    });
  });
}

// Déconnexion
async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

// Gestion du formulaire login / register
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

// Bascule entre mode connexion / création
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
    title.textContent = "Créer un compte Phone®";
    submitBtn.textContent = "Créer un compte";
    toggleLink.textContent = "Déjà un compte ? Se connecter";
  } else {
    modeInput.value = "login";
    title.textContent = "Connexion Phone®";
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
