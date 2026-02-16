// messages.js

import {
  auth,
  db,
  checkAuth,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy
} from "./app.js";
import {
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const CHAT_ID = "global";

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) return;

  const textsCol = collection(db, "messages", CHAT_ID, "texts");

  await addDoc(textsCol, {
    from: user.email,
    text,
    timestamp: serverTimestamp()
  });

  input.value = "";
}

function subscribeMessages() {
  const listEl = document.getElementById("messageList");
  const textsCol = collection(db, "messages", CHAT_ID, "texts");
  const q = query(textsCol, orderBy("timestamp", "asc"));

  onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "message-item";
      const from = data.from || "Inconnu";
      const text = data.text || "";
      div.textContent = from + " : " + text;
      listEl.appendChild(div);
    });
    listEl.scrollTop = listEl.scrollHeight;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    import("./app.js").then(({ logout }) => logout());
  });

  const sendBtn = document.getElementById("sendBtn");
  const input = document.getElementById("messageInput");

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  subscribeMessages();
});
