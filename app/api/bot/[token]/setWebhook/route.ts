import { NextRequest, NextResponse } from 'next/server';
import { BotAPI } from '@/lib/botApi';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { ok: false, error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    const botAPI = new BotAPI(token);
    const result = await botAPI.setWebhook(body.url);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in setWebhook:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
