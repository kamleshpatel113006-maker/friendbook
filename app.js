// FriendBook starter. Add your Firebase web-app configuration in firebase-config.js.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const loginPanel = $("loginPanel"), appPanel = $("appPanel"), grid = $("friendsGrid");
let auth, db, stopListening = null, allFriends = [];

function status(text, online = navigator.onLine) {
  $("connection").textContent = `${online ? "● Online" : "● Offline"} · ${text}`;
}
window.addEventListener("online", () => status("connection restored"));
window.addEventListener("offline", () => status("offline mode"));

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  status("ready");
} catch (e) {
  console.error(e);
  $("loginMessage").textContent = "Firebase setup is incomplete. Follow README.txt, then reload this page.";
}

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginMessage").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (err) {
    $("loginMessage").textContent = friendlyError(err);
  }
});
$("logoutBtn").addEventListener("click", async () => {
  if (auth) await signOut(auth);
});
onAuthStateChangedSafe();

function onAuthStateChangedSafe() {
  if (!auth) return;
  onAuthStateChanged(auth, user => {
    loginPanel.hidden = !!user;
    appPanel.hidden = !user;
    if (stopListening) { stopListening(); stopListening = null; }
    allFriends = [];
    render();
    if (user) {
      $("notice").textContent = "Signed in. Profiles you have already loaded can remain available offline on this device. First sign-in and new cloud updates require internet.";
      const q = query(collection(db, "friends"), orderBy("nameLower"));
      stopListening = onSnapshot(q, { includeMetadataChanges: true }, snap => {
        allFriends = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render();
        status(snap.metadata.fromCache ? "cached data" : "cloud synced");
      }, err => {
        console.error(err);
        $("notice").textContent = "Could not load profiles. Check your internet connection and Firebase database rules.";
      });
    }
  });
}
function friendlyError(err) {
  const codes = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Connect to the internet and try again."
  };
  return codes[err.code] || "Sign-in failed. Check the Firebase setup and account details.";
}
function ageFrom(date) {
  if (!date) return "";
  const b = new Date(`${date}T00:00:00`), now = new Date();
  if (Number.isNaN(b.getTime())) return "";
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age >= 0 ? `${age} years old` : "";
}
function esc(s="") { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function render() {
  const term = $("searchInput").value.trim().toLowerCase();
  const items = allFriends.filter(f => [f.name,f.school,f.classOccupation,f.hobbies,f.phone].some(v => (v||"").toLowerCase().includes(term)));
  grid.innerHTML = items.map(f => {
    const initials = (f.name||"?").split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
    const avatar = f.photo ? `<img src="${esc(f.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : esc(initials);
    const details = [
      f.birthday ? ["🎂", "Birthday", `${esc(f.birthday)}${ageFrom(f.birthday) ? ` · ${ageFrom(f.birthday)}` : ""}`] : null,
      f.phone ? ["☎️", "Phone", esc(f.phone)] : null,
      f.address ? ["📍", "Address", esc(f.address)] : null,
      f.school ? ["🏫", "School", esc(f.school)] : null,
      f.classOccupation ? ["📚", "Class / work", esc(f.classOccupation)] : null,
      f.hobbies ? ["💜", "Interests", esc(f.hobbies)] : null,
      f.notes ? ["📝", "Notes", esc(f.notes)] : null
    ].filter(Boolean);
    return `<article class="friend-card"><div class="card-head"><div class="avatar">${avatar}</div><div><h3>${esc(f.name)}</h3><div class="sub">${esc(f.school||"Friend profile")}</div></div></div>${details.map(d=>`<div class="detail">${d[0]} <b>${d[1]}:</b> ${d[2]}</div>`).join("")}<div class="card-actions"><button class="secondary" data-edit="${esc(f.id)}">Edit</button><button class="delete" data-delete="${esc(f.id)}">Delete</button></div></article>`;
  }).join("");
  $("emptyState").hidden = items.length !== 0;
}
$("searchInput").addEventListener("input", render);
$("addBtn").addEventListener("click", () => openFriend());
$("closeDialog").addEventListener("click", closeDialog);
$("cancelBtn").addEventListener("click", closeDialog);
function closeDialog() { $("friendDialog").close(); $("formMessage").textContent = ""; }
function openFriend(f = null) {
  $("friendForm").reset();
  $("friendId").value = f?.id || "";
  $("dialogTitle").textContent = f ? "Edit friend" : "Add a friend";
  for (const key of ["name","photo","birthday","phone","school","classOccupation","address","hobbies","notes"]) $(key).value = f?.[key] || "";
  $("formMessage").textContent = "";
  $("friendDialog").showModal();
}
grid.addEventListener("click", async e => {
  const editId = e.target.closest("[data-edit]")?.dataset.edit;
  const deleteId = e.target.closest("[data-delete]")?.dataset.delete;
  if (editId) openFriend(allFriends.find(f => f.id === editId));
  if (deleteId) {
    const f = allFriends.find(x => x.id === deleteId);
    if (f && confirm(`Delete ${f.name}'s profile? This affects everyone in the group.`)) {
      try { await deleteDoc(doc(db, "friends", deleteId)); }
      catch (err) { alert("Delete failed. Check your connection and database rules."); }
    }
  }
});
$("friendForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!auth?.currentUser) { $("formMessage").textContent = "Please sign in again."; return; }
  const data = {};
  for (const key of ["name","photo","birthday","phone","school","classOccupation","address","hobbies","notes"]) data[key] = $(key).value.trim();
  data.nameLower = data.name.toLowerCase();
  data.updatedAt = new Date().toISOString();
  try {
    const id = $("friendId").value;
    if (id) await updateDoc(doc(db, "friends", id), data);
    else { data.createdBy = auth.currentUser.uid; await addDoc(collection(db, "friends"), data); }
    closeDialog();
  } catch (err) {
    console.error(err);
    $("formMessage").textContent = "Could not save. Check your internet connection and Firebase database rules.";
  }
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(console.error));
