const admin = require("firebase-admin");
const serviceAccount = require("../../../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

exports.firebaseGet = async (path) => {
  const doc = await db.doc(path).get();
  return doc.exists ? doc.data() : null;
};

exports.firebaseSet = async (path, data) => {
  await db.doc(path).set(data);
  return { success: true };
};

exports.firebaseUpdate = async (path, data) => {
  await db.doc(path).update(data);
  return { success: true };
};
