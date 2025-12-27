import { NextResponse } from 'next/server';
import { getSmoothedSentiment } from '@/lib/sentiment';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getSmoothedSentiment();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error fetching Fear & Greed Index:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Fear & Greed Index' },
      { status: 500 }
    );
  }
}
