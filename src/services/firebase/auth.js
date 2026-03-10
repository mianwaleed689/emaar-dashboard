import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email);

export const verifyEmail = () =>
  sendEmailVerification(auth.currentUser);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const onAuthChange = (callback) =>
  onAuthStateChanged(auth, callback);

export { auth };
