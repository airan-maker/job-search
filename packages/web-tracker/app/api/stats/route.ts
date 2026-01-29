import { NextResponse } from 'next/server';
import { getStats } from '@/lib/sheets';

// GET /api/stats - 통계 조회
export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
