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

// CONFIG FIREBASE
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

// NUMÉRO Phone®
function hashUidToDigits(uid) {
  let out = "";
  for (let i = 0; i < uid.length && out.length < 10; i++) {
    out += (uid.charCodeAt(i) % 10).toString();
  }
  while (out.length < 10) out += "0";
  return out;
}

export async function generatePhoneNumber(uid) {
  const d = hashUidToDigits(uid);
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export async function ensureUserPhone(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().phoneNumber) {
    return snap.data().phoneNumber;
  }

  const phone = await generatePhoneNumber(user.uid);

  await setDoc(ref, {
    email: user.email,
    phoneNumber: phone
  }, { merge: true });

  return phone;
}

// AUTH
export function checkAuth(redirect = true) {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      if (!user && redirect) {
        window.location.href = "login.html";
        return;
      }
      if (user) {
        const phone = await ensureUserPhone(user);
        resolve({ user, phoneNumber: phone });
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
  } catch (err) {
    console.error(err);
    if (setError) setError(err.message);
  }
}

export function logout() {
  return signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

// UTILISATEUR PAR NUMÉRO Phone®
export async function getUserByPhoneNumber(phoneNumber) {
  const qUsers = query(collection(db, "users"), where("phoneNumber", "==", phoneNumber));
  const snap = await getDocs(qUsers);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

// CONVERSATION ENTRE DEUX NUMÉROS
export async function getOrCreateConversation(phoneA, phoneB) {
  const convRef = collection(db, "conversations");
  const qConv = query(
    convRef,
    where("participants", "in", [
      [phoneA, phoneB],
      [phoneB, phoneA]
    ])
  );

  const snap = await getDocs(qConv);
  if (!snap.empty) {
    return snap.docs[0].id;
  }

  const newConv = await addDoc(convRef, {
    participants: [phoneA, phoneB]
  });

  return newConv.id;
}


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
