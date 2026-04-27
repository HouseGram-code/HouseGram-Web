import { NextRequest, NextResponse } from 'next/server';
import { BotAPI } from '@/lib/botApi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const botAPI = new BotAPI(token);
    const result = await botAPI.getMe();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in getMe:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
