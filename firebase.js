const firebase = require('firebase/app');
require('dotenv').config();
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require('./credential.json');

initializeApp({
  credential: cert(serviceAccount)
});

// Get a reference to the database
const db = getFirestore();

module.exports = {firebase, db};
