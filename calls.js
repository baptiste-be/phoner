// calls.js
import {
  checkAuth,
  logout,
  db,
  collection,
  addDoc,
  serverTimestamp
} from './app.js';

const logoutBtn = document.getElementById('logout-btn');
const form = document.getElementById('call-form');
const numberInput = document.getElementById('call-number');
const typeSelect = document.getElementById('call-type');

let currentUser = null;

logoutBtn.addEventListener('click', () => logout());

async function saveCall() {
  if (!currentUser) return;
  const number = numberInput.value.trim();
  const type = typeSelect.value;
  if (!number || !type) return;

  const colRef = collection(db, "history", currentUser.uid, "calls");
  await addDoc(colRef, {
    number,
    type,
    timestamp: serverTimestamp()
  });

  numberInput.value = "";
  typeSelect.value = "entrant";
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  saveCall();
});

checkAuth(true).then(({ user }) => {
  currentUser = user;
});
