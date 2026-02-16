// history.js
import {
  checkAuth,
  logout,
  db,
  collection,
  onSnapshot,
  orderBy,
  query
} from './app.js';

const logoutBtn = document.getElementById('logout-btn');
const listEl = document.getElementById('history-list');

let currentUser = null;

logoutBtn.addEventListener('click', () => logout());

function subscribeHistory() {
  const colRef = collection(db, "history", currentUser.uid, "calls");
  const q = query(colRef, orderBy("timestamp", "desc"));
  onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const div = document.createElement('div');
      div.className = "call-item";
      const time = data.timestamp?.toDate
        ? data.timestamp.toDate().toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          })
        : "";
      div.innerHTML = `
        <div class="call-main">
          <div class="call-number">${data.number || ""}</div>
          <div class="call-time">${time}</div>
        </div>
        <div class="call-type ${data.type}">${data.type}</div>
      `;
      listEl.appendChild(div);
    });
  });
}

checkAuth(true).then(({ user }) => {
  currentUser = user;
  if (user) subscribeHistory();
});
