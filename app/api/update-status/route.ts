import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, status, lastSeen } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Обновляем статус через Firebase
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      status: status || 'offline',
      lastSeen: lastSeen ? new Date(lastSeen) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, userId, status });
  } catch (error: any) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: error.message },
      { status: 500 }
    );
  }
}
