// history.js

import {
  auth,
  db,
  checkAuth,
  collection,
  onSnapshot,
  orderBy
} from "./app.js";
import {
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function subscribeHistory() {
  const listEl = document.getElementById("historyList");
  const user = auth.currentUser;
  if (!user) return;

  const callsCol = collection(db, "history", user.uid, "calls");
  const q = query(callsCol, orderBy("timestamp", "desc"));

  onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-item";
      const type = data.type || "inconnu";
      const number = data.number || "";
      const date = data.timestamp?.toDate
        ? data.timestamp.toDate().toLocaleString()
        : "";
      li.textContent = type.toUpperCase() + " - " + number + " - " + date;
      listEl.appendChild(li);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    import("./app.js").then(({ logout }) => logout());
  });

  subscribeHistory();
});
