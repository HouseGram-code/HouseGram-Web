import { NextRequest, NextResponse } from 'next/server';
import { BotAPI } from '@/lib/botApi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');

    const botAPI = new BotAPI(token);
    const result = await botAPI.getUpdates(offset, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in getUpdates:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
