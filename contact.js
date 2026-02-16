// contacts.js

import {
  auth,
  db,
  checkAuth,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "./app.js";
import { doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function addContact() {
  const nameInput = document.getElementById("contactName");
  const numberInput = document.getElementById("contactNumber");
  const errorBox = document.getElementById("contactError");

  errorBox.textContent = "";

  const name = nameInput.value.trim();
  const number = numberInput.value.trim();

  if (!name || !number) {
    errorBox.textContent = "Nom et numéro requis.";
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    errorBox.textContent = "Utilisateur non connecté.";
    return;
  }

  try {
    const listCol = collection(db, "contacts", user.uid, "list");
    await addDoc(listCol, {
      name,
      number
    });

    nameInput.value = "";
    numberInput.value = "";
    await loadContacts();
  } catch (err) {
    errorBox.textContent = err.message || "Erreur lors de l’ajout du contact.";
  }
}

async function loadContacts() {
  const listEl = document.getElementById("contactList");
  listEl.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  const listCol = collection(db, "contacts", user.uid, "list");
  const snap = await getDocs(listCol);

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.className = "list-item";
    li.textContent = data.name + " - " + data.number;
    listEl.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    import("./app.js").then(({ logout }) => logout());
  });

  const addContactBtn = document.getElementById("addContactBtn");
  addContactBtn.addEventListener("click", addContact);

  await loadContacts();
});
