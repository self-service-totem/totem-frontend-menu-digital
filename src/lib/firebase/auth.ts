import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import type { MockUser, UserRole } from '@/lib/types';

export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth not enabled');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

// Fetches the staff profile from Firestore `staffUsers/{uid}`.
// Returns null if the doc doesn't exist (user created in Auth but not provisioned).
export async function getStaffUserDoc(uid: string): Promise<MockUser | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'staffUsers', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: uid,
    name: d.name,
    email: d.email ?? '',
    role: d.role as UserRole,
    branchId: d.branchId ?? null,
    tenantId: d.tenantId,
  };
}

export function subscribeAuthState(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}
