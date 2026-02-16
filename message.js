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

const contactsListEl = document.getElementById("contacts-list");
const convListEl = document.getElementById("conv-list");
const chatTargetEl = document.getElementById("chat-target");
const messagesEl = document.getElementById("messages-list");
const form = document.getElementById("message-form");
const input = document.getElementById("message-input");

let currentUser = null;
let myPhone = null;
let currentConvId = null;
let currentTargetPhone = null;

function renderMessages(messages) {
  messagesEl.innerHTML = "";
  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = m.from === myPhone ? "msg me" : "msg other";
    div.textContent = m.text;
    messagesEl.appendChild(div);
  });
}

async function openConversation(number) {
  currentTargetPhone = number;
  chatTargetEl.textContent = number;

  const targetUser = await getUserByPhoneNumber(number);
  let convId;

  if (!targetUser) {
    convId = await getOrCreateConversation(myPhone, number);
    await addDoc(collection(db, "conversations", convId, "messages"), {
      from: "SYSTEM",
      text: "Numéro non attribué",
      timestamp: serverTimestamp()
    });
  } else {
    convId = await getOrCreateConversation(myPhone, targetUser.phoneNumber);
  }

  currentConvId = convId;

  const q = query(
    collection(db, "conversations", convId, "messages"),
    orderBy("timestamp", "asc")
  );

  onSnapshot(q, snap => {
    const msgs = [];
    snap.forEach(d => msgs.push(d.data()));
    renderMessages(msgs);
  });
}

async function loadContacts() {
  const snap = await getDocs(collection(db, "contacts", currentUser.uid, "list"));
  contactsListEl.innerHTML = "";
  snap.forEach(doc => {
    const c = doc.data();
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = `${c.name} (${c.number})`;
    div.onclick = () => openConversation(c.number);
    contactsListEl.appendChild(div);
  });
}

async function loadConversations() {
  const q = query(
    collection(db, "userConversations", currentUser.uid, "list"),
    orderBy("lastTimestamp", "desc")
  );

  onSnapshot(q, snap => {
    convListEl.innerHTML = "";
    snap.forEach(doc => {
      const c = doc.data();
      const div = document.createElement("div");
      div.className = "item";
      div.textContent = `${c.otherPhone} : ${c.lastMessage}`;
      div.onclick = () => openConversation(c.otherPhone);
      convListEl.appendChild(div);
    });
  });
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || !currentConvId) return;

  await addDoc(collection(db, "conversations", currentConvId, "messages"), {
    from: myPhone,
    text,
    timestamp: serverTimestamp()
  });

  input.value = "";
});

checkAuth().then(({ user, phoneNumber }) => {
  currentUser = user;
  myPhone = phoneNumber;

  loadContacts();
  loadConversations();
});
