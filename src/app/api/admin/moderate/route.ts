import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection: col, documentId, action } = body;

    if (!col || !documentId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedCollections = ['words', 'voiceRecordings', 'posts'];
    if (!allowedCollections.includes(col)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const docRef = doc(db, col, documentId);

    if (action === 'delete') {
      await deleteDoc(docRef);
      return NextResponse.json({ message: 'Document deleted successfully' });
    }

    if (action === 'approve' || action === 'reject') {
      const status = action === 'approve' ? 'approved' : 'rejected';
      await updateDoc(docRef, { status });
      return NextResponse.json({ message: `Document ${status} successfully` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Moderation action failed' }, { status: 500 });
  }
}
