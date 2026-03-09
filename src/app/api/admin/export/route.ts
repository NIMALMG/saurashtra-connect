import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const q = query(
      collection(db, 'words'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const words = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (format === 'json') {
      return NextResponse.json({ words, exportedAt: new Date().toISOString(), count: words.length });
    }

    // CSV format
    const headers = ['id', 'sauraWord', 'english', 'tamil', 'sentence', 'audioURL', 'authorName', 'createdAt'];
    const csvRows = [
      headers.join(','),
      ...words.map((w: Record<string, unknown>) =>
        headers
          .map((h) => {
            const val = h === 'createdAt' && w[h] && typeof w[h] === 'object' && 'toDate' in (w[h] as object)
              ? (w[h] as { toDate: () => Date }).toDate().toISOString()
              : String(w[h] || '');
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const csv = csvRows.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="saurashtra-words-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
