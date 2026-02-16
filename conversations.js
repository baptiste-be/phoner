// conversations.js
import {
  checkAuth,
  logout,
  db,
  collection,
  onSnapshot,
  orderBy,
  query
} from "./app.js";

const logoutBtn = document.getElementById("logout-btn");
const listEl = document.getElementById("conv-list");

let currentUser = null;

logoutBtn.addEventListener("click", () => logout());

function renderConversations(convs) {
  listEl.innerHTML = "";
  convs.forEach((c) => {
    const div = document.createElement("div");
    div.className = "contact-item";
    const badge = c.unread ? `<span style="color:#4f9cff;font-size:0.8rem;">●</span>` : "";
    const time = c.lastTimestamp?.toDate
      ? c.lastTimestamp.toDate().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";
    div.innerHTML = `
      <div class="contact-main">
        <div class="contact-name">${c.otherPhone || ""} ${badge}</div>
        <div class="contact-number">${c.lastMessage || ""}</div>
      </div>
      <div class="call-time">${time}</div>
    `;
    div.addEventListener("click", () => {
      window.location.href = `message.html?to=${encodeURIComponent(c.otherPhone)}`;
    });
    listEl.appendChild(div);
  });
}

function subscribeConversations() {
  const colRef = collection(db, "userConversations", currentUser.uid, "list");
  const q = query(colRef, orderBy("lastTimestamp", "desc"));
  onSnapshot(q, (snap) => {
    const convs = [];
    snap.forEach((docSnap) => convs.push({ id: docSnap.id, ...docSnap.data() }));
    renderConversations(convs);
  });
}

checkAuth(true).then(({ user }) => {
  currentUser = user;
  if (user) subscribeConversations();
});
