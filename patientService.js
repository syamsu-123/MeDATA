import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './src/firebase';

const patientsCollection = collection(db, 'patients');

/**
 * Get real-time updates for patients based on location.
 * @param {string} location - The location to filter by ('kamar' or 'uks').
 * @param {function} callback - The function to call with the new data.
 * @returns {function} - The unsubscribe function.
 */
export const getPatientsByLocation = (location, callback, onError = () => {}) => {
  if (!location) {
    // Return an empty unsubscribe function if location is not set
    return () => {};
  }
  const q = query(patientsCollection, where('location', '==', location));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const patients = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(patients);
  }, onError);
  return unsubscribe;
};

/**
 * Create a new patient document in Firestore.
 * @param {object} patientData - The data for the new patient.
 * @returns {Promise<DocumentReference>}
 */
export const createPatient = (patientData) => {
  const dataWithTimestamp = {
    ...patientData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(patientsCollection, dataWithTimestamp);
};

export const updatePatient = (patientId, updatedData) => {
  const patientDoc = doc(db, 'patients', patientId);
  return updateDoc(patientDoc, { ...updatedData, updatedAt: serverTimestamp() });
};

export const deletePatient = (patientId) => {
  const patientDoc = doc(db, 'patients', patientId);
  return deleteDoc(patientDoc);
};

export const getPatient = async (patientId) => {
  const snapshot = await getDoc(doc(db, 'patients', patientId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const subscribePatient = (patientId, callback, onError = () => {}) => {
  if (!patientId) return () => {};
  const patientDoc = doc(db, 'patients', patientId);
  return onSnapshot(patientDoc, (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  }, onError);
};