// calls.js

import {
  auth,
  db,
  checkAuth,
  collection,
  addDoc,
  serverTimestamp
} from "./app.js";

async function saveCall() {
  const numberInput = document.getElementById("callNumber");
  const typeSelect = document.getElementById("callType");
  const errorBox = document.getElementById("callError");

  errorBox.textContent = "";

  const number = numberInput.value.trim();
  const type = typeSelect.value;

  if (!number) {
    errorBox.textContent = "Numéro requis.";
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    errorBox.textContent = "Utilisateur non connecté.";
    return;
  }

  try {
    const callsCol = collection(db, "history", user.uid, "calls");
    await addDoc(callsCol, {
      number,
      type,
      timestamp: serverTimestamp()
    });

    numberInput.value = "";
  } catch (err) {
    errorBox.textContent = err.message || "Erreur lors de l’enregistrement de l’appel.";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    import("./app.js").then(({ logout }) => logout());
  });

  const callBtn = document.getElementById("callBtn");
  callBtn.addEventListener("click", saveCall);
});
