import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post, Word, VoiceRecording, Comment } from '@/types';

// ─── Helper: increment user contribution count ───────────────────────────────
async function incrementContribution(userId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      contributionCount: increment(1),
    });
  } catch {
    // Non-blocking — don't fail the main operation if this errors
  }
}

// ─── Words ──────────────────────────────────────────────────────────────────

export async function getApprovedWords(limitCount = 20) {
  const q = query(
    collection(db, 'words'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Word);
}

export async function searchWords(searchTerm: string) {
  const q = query(
    collection(db, 'words'),
    where('status', '==', 'approved'),
    orderBy('sauraWord'),
    limit(100)
  );
  const snap = await getDocs(q);
  const words = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Word);
  const lower = searchTerm.toLowerCase();
  return words.filter(
    (w) =>
      w.sauraWord.toLowerCase().includes(lower) ||
      w.english.toLowerCase().includes(lower) ||
      w.tamil.toLowerCase().includes(lower)
  );
}

export async function addWord(data: Omit<Word, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'words'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await incrementContribution(data.authorId);
  return ref;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getPosts(limitCount = 20, lastDoc?: DocumentSnapshot) {
  // Simple query with just orderBy to avoid composite index requirement
  // All published posts are visible to all users
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    limit(limitCount),
  ];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const q = query(collection(db, 'posts'), ...constraints);
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
  const lastVisible = snap.docs[snap.docs.length - 1];
  return { posts, lastVisible };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const q = query(collection(db, 'posts'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Post;
}

export async function addPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, 'posts'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await incrementContribution(data.authorId);
  return ref;
}

export async function togglePostLike(postId: string, userId: string, currentLikes: string[]) {
  const docRef = doc(db, 'posts', postId);
  const newLikes = currentLikes.includes(userId)
    ? currentLikes.filter((id) => id !== userId)
    : [...currentLikes, userId];
  await updateDoc(docRef, { likes: newLikes });
  return newLikes;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getComments(postId: string) {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
}

export async function addComment(data: Omit<Comment, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'comments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// ─── Voice Recordings ────────────────────────────────────────────────────────

export async function getVoiceRecordings(limitCount = 20) {
  const q = query(
    collection(db, 'voiceRecordings'),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VoiceRecording);
}

export async function addVoiceRecording(data: Omit<VoiceRecording, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'voiceRecordings'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await incrementContribution(data.authorId);
  return ref;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAllUsers(limitCount = 50) {
  // No orderBy to avoid requiring a Firestore index on joinedAt
  const q = query(collection(db, 'users'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getUserProfile(uid: string) {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
}

export async function getUserContributions(userId: string) {
  const [wordsSnap, postsSnap, recordingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'words'), where('authorId', '==', userId), limit(20))),
    getDocs(query(collection(db, 'posts'), where('authorId', '==', userId), limit(20))),
    getDocs(query(collection(db, 'voiceRecordings'), where('authorId', '==', userId), limit(20))),
  ]);
  return {
    words: wordsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Word),
    posts: postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post),
    recordings: recordingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as VoiceRecording),
  };
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats() {
  const [wordsSnap, postsSnap, usersSnap, recordingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'words'), where('status', '==', 'approved'))),
    getDocs(query(collection(db, 'posts'), where('status', '==', 'published'))),
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'voiceRecordings'), where('status', '==', 'approved'))),
  ]);
  return {
    totalWords: wordsSnap.size,
    totalPosts: postsSnap.size,
    totalMembers: usersSnap.size,
    totalRecordings: recordingsSnap.size,
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getPendingContent() {
  // Avoid composite index requirement by not combining where + orderBy
  const [wordsSnap, recordingsSnap] = await Promise.all([
    getDocs(query(collection(db, 'words'), where('status', '==', 'pending'))),
    getDocs(query(collection(db, 'voiceRecordings'), where('status', '==', 'pending'))),
  ]);
  return {
    words: wordsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Word),
    recordings: recordingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as VoiceRecording),
  };
}

export async function moderateContent(
  collectionName: string,
  docId: string,
  action: 'approved' | 'rejected'
) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { status: action });
}

export async function deleteContent(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}
