// contacts.js
import {
  checkAuth,
  logout,
  db,
  collection,
  addDoc,
  getDocs
} from "./app.js";

const logoutBtn = document.getElementById("logout-btn");
const form = document.getElementById("contact-form");
const nameInput = document.getElementById("contact-name");
const numberInput = document.getElementById("contact-number");
const listEl = document.getElementById("contacts-list");

let currentUser = null;

logoutBtn.addEventListener("click", () => logout());

async function addContact() {
  const name = nameInput.value.trim();
  const number = numberInput.value.trim();
  if (!name || !number || !currentUser) return;

  const colRef = collection(db, "contacts", currentUser.uid, "list");
  await addDoc(colRef, { name, number });

  nameInput.value = "";
  numberInput.value = "";
  await loadContacts();
}

async function loadContacts() {
  if (!currentUser) return;
  listEl.innerHTML = "";
  const colRef = collection(db, "contacts", currentUser.uid, "list");
  const snap = await getDocs(colRef);
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const item = document.createElement("div");
    item.className = "contact-item";
    item.innerHTML = `
      <div class="contact-main">
        <div class="contact-name">${data.name || ""}</div>
        <div class="contact-number">${data.number || ""}</div>
      </div>
    `;
    listEl.appendChild(item);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addContact();
});

checkAuth(true).then(({ user }) => {
  currentUser = user;
  if (user) loadContacts();
});
