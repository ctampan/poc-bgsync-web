// firebaseConfig.ts
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import firebaseConfig from "./firebaseConfig";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  firebase.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });
  firebase
    .firestore()
    .enablePersistence()
    .catch(() => {});
}

export const firestore = firebase.firestore();

export const FieldValue = firebase.firestore.FieldValue;
export const FieldPath = firebase.firestore.FieldPath;
export const FirestoreTimestamp = firebase.firestore.Timestamp;
