import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'approved';
    const limitCount = parseInt(searchParams.get('limit') || '50');

    const q = query(
      collection(db, 'words'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    let words = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (search) {
      const lower = search.toLowerCase();
      words = words.filter((w: Record<string, unknown>) =>
        String(w.sauraWord || '').toLowerCase().includes(lower) ||
        String(w.english || '').toLowerCase().includes(lower)
      );
    }

    return NextResponse.json({ words, count: words.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sauraWord, english, tamil, sentence, audioURL, authorId, authorName } = body;

    if (!sauraWord || !english || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, 'words'), {
      sauraWord, english, tamil: tamil || '', sentence: sentence || '',
      audioURL: audioURL || '',
      authorId, authorName,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, message: 'Word submitted for review' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit word' }, { status: 500 });
  }
}
