import { NextResponse } from 'next/server';
import { collection, getDocs, doc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

// IMPORTANT: Gamification Rules
// Word -> +1
// Recording -> +2
// Blog -> +3

export async function POST(req: Request) {
  try {
    // Note: In a real production app, verify an Admin Token here.
    // For this one-time script running locally, we will proceed.
    
    // 1. Fetch all users
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }) as User);

    // 2. We will use a batch to execute updates safely
    const batch = writeBatch(db);
    let migratedCount = 0;

    for (const user of users) {
      // 3. For each user, aggressively query their exact content counts
      // Note: We count ALL authored content as points are given on creation
      // from the existing addWord, addPost, addVoiceRecording implementations.
      const [wordsSnap, postsSnap, recordingsSnap] = await Promise.all([
        getDocs(query(collection(db, 'words'), where('authorId', '==', user.uid))),
        getDocs(query(collection(db, 'posts'), where('authorId', '==', user.uid))),
        getDocs(query(collection(db, 'voiceRecordings'), where('authorId', '==', user.uid))),
      ]);

      const wordsCount = wordsSnap.size;
      const blogsCount = postsSnap.size;
      const recordingsCount = recordingsSnap.size;

      const computedScore = (blogsCount * 3) + (wordsCount * 1) + (recordingsCount * 2);

      // 4. Compute Badges
      const badges: string[] = [];
      if (wordsCount >= 1) badges.push('first_word');
      if (wordsCount >= 10) badges.push('word_contributor');
      if (recordingsCount >= 1) badges.push('voice_beginner');
      if (recordingsCount >= 10) badges.push('voice_keeper');
      if (blogsCount >= 3) badges.push('writer');
      if (computedScore >= 50) badges.push('language_guardian');

      // 5. Check if update is strictly necessary (missing or incorrect data)
      const needsUpdate = 
        !user.contributions || 
        user.contributions.blogs !== blogsCount ||
        user.contributions.words !== wordsCount ||
        user.contributions.recordings !== recordingsCount ||
        user.score !== computedScore ||
        !user.badges ||
        user.badges.length !== badges.length;

      if (needsUpdate || user.score === undefined) {
        const userRef = doc(db, 'users', user.uid);
        
        // Merge true is default for updateDoc, but since we are using batch.set with merge: true or batch.update
        // it's safer to use batch.update to explicitly only touch these fields.
        batch.update(userRef, {
          contributions: {
            blogs: blogsCount,
            words: wordsCount,
            recordings: recordingsCount
          },
          score: computedScore,
          badges: badges
        });
        
        migratedCount++;
      }
    }

    // 6. Commit the entire batch
    if (migratedCount > 0) {
      // Note: A single batch can only hold 500 writes. If there are > 500 users, 
      // we'd chunk this. For our community project, one batch should suffice.
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully calculated and migrated ${migratedCount} legacy users to the new Gamification Schema.`,
      usersScanned: users.length
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
