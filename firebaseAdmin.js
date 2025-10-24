// const admin = require("firebase-admin");

// const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
// if (!serviceAccount) {
//   throw new Error("SERVICE_ACCOUNT_JSON environment variable is not defined");
// }

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const db = admin.firestore();
// module.exports = { admin, db };


// const admin = require("firebase-admin");
// require('dotenv').config(); // only needed locally

// const serviceAccountJSON = process.env.SERVICE_ACCOUNT_JSON;


// if (!serviceAccountJSON) {
//   throw new Error("SERVICE_ACCOUNT_JSON environment variable is not defined");
// }

// let serviceAccount;
// try {
//   serviceAccount = JSON.parse(serviceAccountJSON);
// } catch (err) {
//   console.error("Invalid SERVICE_ACCOUNT_JSON:", err.message);
//   process.exit(1);
// }

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const db = admin.firestore();
// module.exports = { admin, db };


const admin = require("firebase-admin");

// Parse the JSON from env
let serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

// Fix newlines in private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = { admin, db };
