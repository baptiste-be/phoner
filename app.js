// app.js
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJZ7do_9CSXrG2npc1DPi0F2mzmRUFuBw",
  authDomain: "phone-7b65b.firebaseapp.com",
  projectId: "phone-7b65b",
  storageBucket: "phone-7b65b.firebasestorage.app",
  messagingSenderId: "385403300521",
  appId: "1:385403300521:web:7e9c475a025fce7b8697b8",
  measurementId: "G-FPF77V4WN7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function hashUidToDigits(uid) {
  let acc = "";
  for (let i = 0; i < uid.length && acc.length < 10; i++) {
    const code = uid.charCodeAt(i);
    acc += (code % 10).toString();
  }
  while (acc.length < 10) acc += "0";
  return acc;
}

export async function generatePhoneNumber(uid) {
  const digits = hashUidToDigits(uid);
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

export async function ensureUserPhone(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.phoneNumber) return data.phoneNumber;
  }
  const phoneNumber = await generatePhoneNumber(user.uid);
  await setDoc(userRef, {
    email: user.email,
    phoneNumber
  }, { merge: true });
  return phoneNumber;
}

export function checkAuth(redirectIfNoUser = true) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user && redirectIfNoUser) {
        window.location.href = "login.html";
        return;
      }
      if (user) {
        const phoneNumber = await ensureUserPhone(user);
        resolve({ user, phoneNumber });
      } else {
        resolve({ user: null, phoneNumber: null });
      }
    });
  });
}

export async function submitForm(mode, email, password, setError) {
  try {
    let cred;
    if (mode === "login") {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } else {
      cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserPhone(cred.user);
    }
    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    if (setError) setError(e.message);
  }
}

export function logout() {
  return signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

// Export Firestore helpers
export {
  auth,
  db,
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
