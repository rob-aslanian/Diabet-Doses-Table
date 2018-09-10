import firebase from "firebase/app";
import "firebase/firestore";

// Initialize Firebase
const config = {
  apiKey: "AIzaSyC1P2Z8eXaO4-yCeJXKs6FY4f26uYDYKrI",
  authDomain: "dd-table.firebaseapp.com",
  databaseURL: "https://dd-table.firebaseio.com",
  projectId: "dd-table",
  storageBucket: "dd-table.appspot.com",
  messagingSenderId: "332464043430"
};

firebase.initializeApp(config);

const firestore = firebase.firestore();
const settings = { /* your settings... */ timestampsInSnapshots: true };
firestore.settings(settings);

export default firestore;
