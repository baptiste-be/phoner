// messages.js
import {
  checkAuth,
  logout,
  db,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  getUserByPhoneNumber,
  getOrCreateConversation
} from "./app.js";

const logoutBtn = document.getElementById("logout-btn");
const targetForm = document.getElementById("target-form");
const targetInput = document.getElementById("target-number");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const listEl = document.getElementById("messages-list");

let currentUser = null;
let myPhone = null;
let currentConvId = null;
let unsubscribeConv = null;
let currentTargetNumber = null;

logoutBtn.addEventListener("click", () => logout());

function renderMessages(messages) {
  listEl.innerHTML = "";
  messages.forEach((m) => {
    const div = document.createElement("div");
    const isMe = m.from === myPhone;
    const isSystem = m.from === "SYSTEM";
    div.className = "message-bubble " + (isMe ? "me" : "other");
    const time = m.timestamp?.toDate
      ? m.timestamp.toDate().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";
    div.innerHTML = `
      <div>${m.text || ""}</div>
      <div class="message-meta">${isSystem ? "Système" : (m.from || "")} • ${time}</div>
    `;
    listEl.appendChild(div);
  });
  listEl.scrollTop = listEl.scrollHeight;
}

function subscribeToConversation(convId) {
  if (unsubscribeConv) {
    unsubscribeConv();
    unsubscribeConv = null;
  }
  const colRef = collection(db, "conversations", convId, "messages");
  const q = query(colRef, orderBy("timestamp", "asc"));
  unsubscribeConv = onSnapshot(q, (snap) => {
    const messages = [];
    snap.forEach((docSnap) => messages.push(docSnap.data()));
    renderMessages(messages);
  });
}

async function openConversationWithNumber(number) {
  if (!myPhone) return;
  currentTargetNumber = number;

  const targetUser = await getUserByPhoneNumber(number);
  let convId;

  if (!targetUser) {
    convId = await getOrCreateConversation(myPhone, number);
    const colRef = collection(db, "conversations", convId, "messages");
    await addDoc(colRef, {
      from: "SYSTEM",
      text: "Le numéro que vous essayez de joindre n'est pas attribué.",
      timestamp: serverTimestamp()
    });
  } else {
    convId = await getOrCreateConversation(myPhone, targetUser.phoneNumber);
  }

  currentConvId = convId;
  subscribeToConversation(convId);
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || !myPhone || !currentTargetNumber) return;

  const targetUser = await getUserByPhoneNumber(currentTargetNumber);
  let convId;

  if (!targetUser) {
    convId = await getOrCreateConversation(myPhone, currentTargetNumber);
    const colRef = collection(db, "conversations", convId, "messages");
    await addDoc(colRef, {
      from: "SYSTEM",
      text: "Le numéro que vous essayez de joindre n'est pas attribué.",
      timestamp: serverTimestamp()
    });
  } else {
    convId = await getOrCreateConversation(myPhone, targetUser.phoneNumber);
    const colRef = collection(db, "conversations", convId, "messages");
    await addDoc(colRef, {
      from: myPhone,
      text,
      timestamp: serverTimestamp()
    });
  }

  currentConvId = convId;
  subscribeToConversation(convId);
  input.value = "";
}

targetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const number = targetInput.value.trim();
  if (!number) return;
  openConversationWithNumber(number);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

checkAuth(true).then(({ user, phoneNumber }) => {
  currentUser = user;
  myPhone = phoneNumber;
});
