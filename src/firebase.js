// firebase.js
import admin from "firebase-admin";
import fs from "fs";

const serviceAccountPath = "/etc/secrets/firebase-service-account.json";

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
  ),
});

export default admin;
