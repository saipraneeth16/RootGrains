// One-time script to delete all products from Firestore
// Run with: node clear-products.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRI3roS2j8VfVK_mEsLtYuIq2gspZKjpQ",
  authDomain: "kbr-app-9991a.firebaseapp.com",
  projectId: "kbr-app-9991a",
  storageBucket: "kbr-app-9991a.firebasestorage.app",
  messagingSenderId: "823515119777",
  appId: "1:823515119777:web:2aea5a7b71f7ab1fbe0cb8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");

const snap = await getDocs(collection(db, "products"));
console.log(`Found ${snap.docs.length} products. Deleting...`);
for (const d of snap.docs) {
  await deleteDoc(doc(db, "products", d.id));
  console.log(`Deleted: ${d.id}`);
}
console.log("✅ All products deleted. Now add them fresh via the admin panel.");
process.exit(0);
