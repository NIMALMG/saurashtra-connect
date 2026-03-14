'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string): Promise<User | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as User;
      }
      return null;
    } catch {
      return null;
    }
  };

  const createUserProfile = async (firebaseUser: FirebaseUser, displayName?: string) => {
    const docRef = doc(db, 'users', firebaseUser.uid);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      // First-ever sign-in: create the profile document
      const profile: Omit<User, 'uid'> = {
        email: firebaseUser.email || '',
        displayName: displayName || firebaseUser.displayName || 'Community Member',
        photoURL: firebaseUser.photoURL || '',
        role: 'user',
        joinedAt: serverTimestamp() as never,
        contributionCount: 0,
        bio: '',
        region: '',
        score: 0,
        badges: [],
        contributions: {
          blogs: 0,
          words: 0,
          recordings: 0,
        },
      };
      await setDoc(docRef, profile);
      setUserProfile({ uid: firebaseUser.uid, ...profile });
    } else {
      // Existing user: sync photoURL + displayName from Firebase Auth → Firestore
      // (covers Google accounts where the photo may have changed or wasn't stored)
      const existingData = existing.data();
      const updates: Record<string, string> = {};

      const authPhoto = firebaseUser.photoURL || '';
      const authName = displayName || firebaseUser.displayName || '';

      if (authPhoto && existingData.photoURL !== authPhoto) {
        updates.photoURL = authPhoto;
      }
      if (authName && existingData.displayName !== authName && !existingData.displayName) {
        updates.displayName = authName;
      }

      if (Object.keys(updates).length > 0) {
        await import('firebase/firestore').then(({ updateDoc }) => updateDoc(docRef, updates));
      }

      setUserProfile({ uid: firebaseUser.uid, ...existingData, ...updates } as User);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName });
    await createUserProfile(newUser, displayName);
  };

  const signIn = async (email: string, password: string) => {
    const { user: signedInUser } = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(signedInUser);
  };

  const signInWithGoogle = async () => {
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    await createUserProfile(googleUser);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
