const firebase = require('firebase/app');
require('dotenv').config();
require('firebase/database');
const { getDatabase, ref, set } = require("firebase/database");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID ,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

const app = firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const db = getDatabase();

module.exports = {firebase, db};
