FRIENDBOOK STARTER - SETUP GUIDE
=================================

WHAT THIS VERSION DOES
- Responsive dark-theme friends directory for Android and Windows browsers.
- Shared Firebase email/password login (everyone uses the same account if you choose).
- Add, edit, search and delete friend profiles.
- Firestore cloud synchronization and offline cache for profiles already loaded.
- Installable PWA shell. For reliable installation, host it over HTTPS.

IMPORTANT LIMITATIONS
- This starter needs a Firebase project before login/cloud data will work.
- Offline access is for data already cached on that device. First login and new cloud updates need internet.
- Firebase's client configuration is not a secret; database rules and Authentication are what protect data.
- The included rules allow ANY signed-in account to read/edit/delete all friend profiles. This matches your choice that everyone who logs in can edit, but it also means anyone who gets the shared login can change or delete everything. For better security, use individual accounts later.
- Only store friends' personal information with their permission. Avoid storing sensitive information unnecessarily.
- The starter does not yet upload photo files. It accepts an image URL.

STEP 1 - CREATE A FIREBASE PROJECT
1. Open https://console.firebase.google.com/ on your Windows computer.
2. Create a project named FriendBook.
3. In Project settings, add a Web app (</> icon) and copy its config values.
4. Paste those values into firebase-config.js, replacing all PASTE_... placeholders.
5. In Firebase Authentication > Sign-in method, enable Email/Password.
6. In Authentication > Users, add a group account email and password. Everyone can use this same login, if that is what you want.
7. In Firestore Database, create a database.
8. Open Firestore Rules and paste the contents of firestore.rules, then Publish.

STEP 2 - RUN / HOST IT
The Firebase JavaScript modules need a web server, not a file:// URL.
Simple local testing:
1. Install Node.js from https://nodejs.org/ if it is not already installed.
2. Open a terminal in this FriendBook folder.
3. Run: npx serve .
4. Open the local address printed by the command. Localhost works on your computer.
For Android and cross-device access, deploy the folder to an HTTPS static host. Firebase Hosting is one option:
https://firebase.google.com/docs/hosting
Follow Firebase's current Hosting setup guide to deploy the app.

STEP 3 - OPEN ON ANDROID AND WINDOWS
1. Visit the HTTPS address on Android Chrome and Windows Edge/Chrome.
2. Sign in with the group account.
3. On Android, use browser menu > Add to Home screen / Install app.
4. On Windows, use the browser's Install app option if offered.

OFFLINE BEHAVIOUR
- The app shell is cached by the service worker.
- Firestore persistent cache can show profiles previously loaded on that device.
- Sign in while online at least once. Changes made offline may queue locally and sync when online again, but check for errors after reconnecting.
- Do not assume a change synced until the app has reconnected and refreshed successfully.

TROUBLESHOOTING
- If sign-in fails, confirm the email/password user exists in Firebase Authentication.
- If profile changes fail, confirm Firestore is created and firestore.rules are published.
- If the app says setup incomplete, check firebase-config.js for typos and reload.
