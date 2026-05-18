import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goalId');
  const quarter = searchParams.get('quarter');

  try {
    const whereClause = {};
    if (goalId) whereClause.goalId = goalId;
    if (quarter) whereClause.quarter = quarter;

    const checkIns = await prisma.checkIn.findMany({
      where: whereClause,
      include: { goal: { include: { owner: true } } },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(checkIns);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { goalId, quarter, actualAchievement, status, managerComment } = data;

    // See if a check-in for this goal & quarter already exists
    const existing = await prisma.checkIn.findFirst({
      where: { goalId, quarter }
    });

    let checkIn;
    if (existing) {
      checkIn = await prisma.checkIn.update({
        where: { id: existing.id },
        data: {
          actualAchievement: actualAchievement !== undefined ? parseFloat(actualAchievement) : existing.actualAchievement,
          status: status || existing.status,
          managerComment: managerComment !== undefined ? managerComment : existing.managerComment,
          date: new Date()
        }
      });
    } else {
      checkIn = await prisma.checkIn.create({
        data: {
          goalId,
          quarter,
          actualAchievement: parseFloat(actualAchievement || 0),
          status: status || 'Not Started',
          managerComment
        }
      });
    }

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error('Error saving check-in:', error);
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
  }
}
