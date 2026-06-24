// Firebase init para la demo del totem.
// La config web NO es secreta; la seguridad real vive en las Security Rules.
// Se inicializa solo si VITE_USE_FIREBASE === 'true' y hay projectId configurado.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled =
  import.meta.env.VITE_USE_FIREBASE === 'true' && Boolean(firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    firebaseAuth = getAuth(app);
    firebaseStorage = getStorage(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase] init failed, falling back to localStorage-only', err);
    app = null;
    firestore = null;
    firebaseAuth = null;
    firebaseStorage = null;
  }
}

// db, auth y storageInstance son null cuando Firebase está deshabilitado o falló la init.
export const db = firestore;
export const auth = firebaseAuth;
export const storageInstance = firebaseStorage;
