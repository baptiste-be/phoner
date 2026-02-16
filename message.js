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
  getOrCreateConversation,
  updateUserConversation,
  markConversationRead
} from "./app.js";

const logoutBtn = document.getElementById("logout-btn");
const convListEl = document.getElementById("conv-list");
const chatTargetEl = document.getElementById("chat-target");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messagesEl = document.getElementById("messages-list");

let currentUser = null;
let myPhone = null;

let currentConvId = null;
let currentTargetPhone = null;
let unsubscribeConv = null;
let unsubscribeConvList = null;

logoutBtn.addEventListener("click", () => logout());

/* ---------- RENDER MESSAGES ---------- */

function renderMessages(messages) {
  messagesEl.innerHTML = "";
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
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* ---------- RENDER CONVERSATIONS LIST ---------- */

function renderConversationsList(convs) {
  convListEl.innerHTML = "";
  convs.forEach((c) => {
    const div = document.createElement("div");
    div.className = "conv-item" + (c.conversationId === currentConvId ? " active" : "");
    const badge = c.unread ? `<span class="conv-badge">●</span>` : "";
    const time = c.lastTimestamp?.toDate
      ? c.lastTimestamp.toDate().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";
    div.innerHTML = `
      <div class="conv-main">
        <div class="conv-phone">${c.otherPhone || ""} ${badge}</div>
        <div class="conv-last">${c.lastMessage || ""}</div>
      </div>
      <div class="conv-meta">${time}</div>
    `;
    div.addEventListener("click", () => {
      openConversationByMeta(c.otherPhone, c.conversationId);
    });
    convListEl.appendChild(div);
  });
}

/* ---------- SUBSCRIPTIONS ---------- */

function subscribeToConversation(convId) {
  if (unsubscribeConv) {
    unsubscribeConv();
    unsubscribeConv = null;
  }
  const colRef = collection(db, "conversations", convId, "messages");
  const q = query(colRef, orderBy("timestamp", "asc"));
  unsubscribeConv = onSnapshot(q, async (snap) => {
    const messages = [];
    snap.forEach((docSnap) => messages.push(docSnap.data()));
    renderMessages(messages);
    if (currentUser && convId) {
      await markConversationRead(currentUser.uid, convId);
    }
  });
}

function subscribeToConversationList() {
  if (!currentUser) return;
  if (unsubscribeConvList) {
    unsubscribeConvList();
    unsubscribeConvList = null;
  }
  const colRef = collection(db, "userConversations", currentUser.uid, "list");
  const q = query(colRef, orderBy("lastTimestamp", "desc"));
  unsubscribeConvList = onSnapshot(q, (snap) => {
    const convs = [];
    snap.forEach((docSnap) => convs.push({ id: docSnap.id, ...docSnap.data() }));
    renderConversationsList(convs);
  });
}

/* ---------- OPEN CONVERSATION ---------- */

async function openConversationByMeta(otherPhone, convIdFromMeta = null) {
  if (!myPhone || !currentUser) return;

  currentTargetPhone = otherPhone;
  chatTargetEl.textContent = otherPhone;

  let convId = convIdFromMeta;

  if (!convId) {
    const targetUser = await getUserByPhoneNumber(otherPhone);
    if (!targetUser) {
      convId = await getOrCreateConversation(myPhone, otherPhone);
      const colRef = collection(db, "conversations", convId, "messages");
      await addDoc(colRef, {
        from: "SYSTEM",
        text: "Le numéro que vous essayez de joindre n'est pas attribué.",
        timestamp: serverTimestamp()
      });
      await updateUserConversation(currentUser.uid, myPhone, otherPhone, convId, "Numéro non attribué", false);
    } else {
      convId = await getOrCreateConversation(myPhone, targetUser.phoneNumber);
      await updateUserConversation(currentUser.uid, myPhone, targetUser.phoneNumber, convId, "Conversation ouverte", false);
      await updateUserConversation(targetUser.uid, targetUser.phoneNumber, myPhone, convId, "Conversation ouverte", true);
    }
  }

  currentConvId = convId;
  subscribeToConversation(convId);
}

/* ---------- SEND MESSAGE ---------- */

async function sendMessage() {
  const text = input.value.trim();
  if (!text || !myPhone || !currentTargetPhone || !currentUser) return;

  const targetUser = await getUserByPhoneNumber(currentTargetPhone);
  let convId;

  if (!targetUser) {
    convId = await getOrCreateConversation(myPhone, currentTargetPhone);
    const colRef = collection(db, "conversations", convId, "messages");
    await addDoc(colRef, {
      from: "SYSTEM",
      text: "Le numéro que vous essayez de joindre n'est pas attribué.",
      timestamp: serverTimestamp()
    });

    await updateUserConversation(currentUser.uid, myPhone, currentTargetPhone, convId, "Numéro non attribué", false);
  } else {
    convId = await getOrCreateConversation(myPhone, targetUser.phoneNumber);
    const colRef = collection(db, "conversations", convId, "messages");
    await addDoc(colRef, {
      from: myPhone,
      text,
      timestamp: serverTimestamp()
    });

    await updateUserConversation(currentUser.uid, myPhone, targetUser.phoneNumber, convId, text, false);
    await updateUserConversation(targetUser.uid, targetUser.phoneNumber, myPhone, convId, text, true);
  }

  currentConvId = convId;
  subscribeToConversation(convId);
  input.value = "";
}

/* ---------- EVENTS ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

/* ---------- INIT ---------- */

checkAuth(true).then(({ user, phoneNumber }) => {
  currentUser = user;
  myPhone = phoneNumber;
  if (user) {
    subscribeToConversationList();
  }
});
