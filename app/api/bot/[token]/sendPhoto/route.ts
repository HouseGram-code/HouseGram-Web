import { NextRequest, NextResponse } from 'next/server';
import { BotAPI } from '@/lib/botApi';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();

    const botAPI = new BotAPI(token);
    const result = await botAPI.sendPhoto(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in sendPhoto:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
