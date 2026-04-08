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
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post, Word, VoiceRecording, Comment, User } from '@/types';

// ─── Gamification & Scoring Engine ──────────────────────────────────────────

type ContributionType = 'word' | 'recording' | 'post';

async function updateUserScore(userId: string, type: ContributionType) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    
    // Safely fallback current data
    const currentBlogs = userData.contributions?.blogs || 0;
    const currentWords = userData.contributions?.words || 0;
    const currentRecs = userData.contributions?.recordings || 0;
    const currentScore = userData.score || 0;
    const currentBadges: string[] = userData.badges || [];

    // Calculate increments
    let pointsToAdd = 0;
    const updates: Record<string, any> = {
      contributionCount: increment(1)
    };

    if (type === 'word') {
      pointsToAdd = 1;
      updates['contributions.words'] = increment(1);
      
      if (currentWords + 1 === 1 && !currentBadges.includes('first_word')) {
        currentBadges.push('first_word');
      }
      if (currentWords + 1 === 10 && !currentBadges.includes('word_contributor')) {
        currentBadges.push('word_contributor');
      }
    } else if (type === 'recording') {
      pointsToAdd = 2;
      updates['contributions.recordings'] = increment(1);
      
      if (currentRecs + 1 === 1 && !currentBadges.includes('voice_beginner')) {
        currentBadges.push('voice_beginner');
      }
      if (currentRecs + 1 === 10 && !currentBadges.includes('voice_keeper')) {
        currentBadges.push('voice_keeper');
      }
    } else if (type === 'post') {
      pointsToAdd = 3;
      updates['contributions.blogs'] = increment(1);
      
      if (currentBlogs + 1 === 3 && !currentBadges.includes('writer')) {
        currentBadges.push('writer');
      }
    }

    // Check high level score badge
    if (currentScore + pointsToAdd >= 50 && !currentBadges.includes('language_guardian')) {
      currentBadges.push('language_guardian');
    }

    updates['score'] = increment(pointsToAdd);
    updates['badges'] = currentBadges;

    // Execute atomic update
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Failed to update user score:', error);
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
  await updateUserScore(data.authorId, 'word');
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
  await updateUserScore(data.authorId, 'post');
  return ref;
}

export async function togglePostLike(postId: string, userId: string, currentLikes: string[]) {
  const docRef = doc(db, 'posts', postId);
  const isLiked = currentLikes.includes(userId);

  // Atomic operation: prevents race conditions with concurrent likes
  await updateDoc(docRef, {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
  });

  // Return the optimistic result for immediate UI update
  return isLiked
    ? currentLikes.filter((id) => id !== userId)
    : [...currentLikes, userId];
}

// ─── Delete Post ─────────────────────────────────────────────────────────────

export async function deletePost(postId: string, authorId: string) {
  const batch = writeBatch(db);

  // 1. Delete the post itself
  batch.delete(doc(db, 'posts', postId));

  // 2. Cascade: delete all comments belonging to this post
  const commentsSnap = await getDocs(
    query(collection(db, 'comments'), where('postId', '==', postId))
  );
  commentsSnap.docs.forEach((commentDoc) => {
    batch.delete(commentDoc.ref);
  });

  // 3. Decrement the author's blog contribution count and score
  const userRef = doc(db, 'users', authorId);
  batch.update(userRef, {
    'contributions.blogs': increment(-1),
    contributionCount: increment(-1),
    score: increment(-3), // Posts are worth 3 points
  });

  await batch.commit();
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

export async function getVoiceRecordings(limitCount = 50) {
  // Avoid composite index requirement by not combining where + orderBy in the query
  const q = query(
    collection(db, 'voiceRecordings'),
    where('status', '==', 'approved'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  const recordings = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VoiceRecording);
  
  // Sort client-side descending by createdAt
  return recordings.sort((a, b) => {
    const getMs = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (val instanceof Date) return val.getTime();
      if (typeof val.getTime === 'function') return val.getTime();
      return 0;
    };
    return getMs(b.createdAt) - getMs(a.createdAt);
  });
}

export async function addVoiceRecording(data: Omit<VoiceRecording, 'id' | 'createdAt' | 'status'>) {
  const ref = await addDoc(collection(db, 'voiceRecordings'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  await updateUserScore(data.authorId, 'recording');
  return ref;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAllUsers(limitCount = 50): Promise<User[]> {
  // No orderBy to avoid requiring a Firestore index on joinedAt
  const q = query(collection(db, 'users'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
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
