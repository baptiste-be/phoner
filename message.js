// messages.js
import {
  checkAuth,
  logout,
  db,
  collection,
  addDoc,
  getDocs,
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
const contactsListEl = document.getElementById("contacts-list");
const convListEl = document.getElementById("conv-list");
const chatTargetNameEl = document.getElementById("chat-target-name");
const chatTargetSubEl = document.getElementById("chat-target-sub");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messagesEl = document.getElementById("messages-list");
const newChatBtn = document.getElementById("new-chat-btn");

let currentUser = null;
let myPhone = null;

let currentConvId = null;
let currentTargetPhone = null;
let unsubscribeConv = null;
let unsubscribeConvList = null;

/* ---------- UI HELPERS ---------- */

function setNoConversation() {
  currentConvId = null;
  currentTargetPhone = null;
  chatTargetNameEl.textContent = "Aucune conversation";
  chatTargetSubEl.textContent = "Sélectionne un contact ou crée une discussion";
  messagesEl.innerHTML = "";
}

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
      <div>${m.text}</div>
      <div class="message-meta">${isSystem ? "Système" : m.from} • ${time}</div>
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
    div.className = "list-item" + (c.conversationId === currentConvId ? " active" : "");

    const badge = c.unread ? `<span class="badge">●</span>` : "";

    const time = c.lastTimestamp?.toDate
      ? c.lastTimestamp.toDate().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    div.innerHTML = `
      <div class="item-main">
        <div class="item-title">${c.otherPhone} ${badge}</div>
        <div class="item-sub">${c.lastMessage || ""}</div>
      </div>
      <div class="item-meta">${time}</div>
    `;

    div.addEventListener("click", () => {
      openConversation(c.otherPhone, c.conversationId);
    });

    convListEl.appendChild(div);
  });
}

/* ---------- LOAD CONTACTS ---------- */

async function loadContacts() {
  const colRef = collection(db, "contacts", currentUser.uid, "list");
  const snap = await getDocs(colRef);

  contactsListEl.innerHTML = "";

  snap.forEach((docSnap) => {
    const c = docSnap.data();

    const div = document.createElement("div");
    div.className = "list-item";

    div.innerHTML = `
      <div class="item-main">
        <div class="item-title">${c.name || "Contact"}</div>
        <div class="item-sub">${c.number}</div>
      </div>
    `;

    div.addEventListener("click", () => {
      openConversation(c.number);
    });

    contactsListEl.appendChild(div);
  });
}

/* ---------- SUBSCRIPTIONS ---------- */

function subscribeToConversation(convId) {
  if (unsubscribeConv) unsubscribeConv();

  const colRef = collection(db, "conversations", convId, "messages");
  const q = query(colRef, orderBy("timestamp", "asc"));

  unsubscribeConv = onSnapshot(q, async (snap) => {
    const messages = [];
    snap.forEach((docSnap) => messages.push(docSnap.data()));
    renderMessages(messages);

    await markConversationRead(currentUser.uid, convId);
  });
}

function subscribeToConversationList() {
  if (unsubscribeConvList) unsubscribeConvList();

  const colRef = collection(db, "userConversations", currentUser.uid, "list");
  const q = query(colRef, orderBy("lastTimestamp", "desc"));

  unsubscribeConvList = onSnapshot(q, (snap) => {
    const convs = [];
    snap.forEach((docSnap) => convs.push({ id: docSnap.id, ...docSnap.data() }));
    renderConversationsList(convs);
  });
}

/* ---------- OPEN CONVERSATION ---------- */

async function openConversation(otherPhone, convId = null) {
  currentTargetPhone = otherPhone;
  chatTargetNameEl.textContent = otherPhone;
  chatTargetSubEl.textContent = "Conversation active";

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
  if (!text || !currentTargetPhone) return;

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

/* ---------- NEW CHAT BUTTON ---------- */

newChatBtn.addEventListener("click", async () => {
  const number = prompt("Numéro Phone® du destinataire (XX-XX-XX-XX-XX) :");
  if (!number) return;
  openConversation(number);
});

/* ---------- EVENTS ---------- */

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

logoutBtn.addEventListener("click", () => logout());

/* ---------- INIT ---------- */

checkAuth().then(({ user, phoneNumber }) => {
  currentUser = user;
  myPhone = phoneNumber;
  setNoConversation();
  loadContacts();
  subscribeToConversationList();
});
