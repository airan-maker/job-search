import { NextRequest, NextResponse } from 'next/server';
import { getPositions, addPosition } from '@/lib/sheets';

// GET /api/positions - 모든 포지션 조회
export async function GET() {
  try {
    const positions = await getPositions();
    return NextResponse.json({ positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// POST /api/positions - 새 포지션 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const position = {
      company: body.company || '',
      title: body.title || '',
      url: body.url || '',
      status: body.status || '관심',
      salary: body.salary || '',
      location: body.location || '',
      notes: body.notes || '',
      appliedDate: body.appliedDate || '',
    };

    await addPosition(position);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding position:', error);
    return NextResponse.json(
      { error: 'Failed to add position' },
      { status: 500 }
    );
  }
}
