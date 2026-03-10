import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

export const getDocument = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getDocuments = async (collectionName) => {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const setDocument = async (collectionName, id, data) =>
  setDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const addDocument = async (collectionName, data) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });

export const updateDocument = async (collectionName, id, data) =>
  updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

export const deleteDocument = async (collectionName, id) =>
  deleteDoc(doc(db, collectionName, id));

export const subscribeToCollection = (collectionName, callback) =>
  onSnapshot(collection(db, collectionName), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

export { db, collection, doc, query, orderBy, where, onSnapshot };
