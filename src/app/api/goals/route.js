import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const role = searchParams.get('role');

  try {
    if (!userId && role !== 'ADMIN') return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    let goals = [];
    if (role === 'EMPLOYEE') {
      goals = await prisma.goal.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'MANAGER') {
      // Manager views goals of their employees
      goals = await prisma.goal.findMany({
        where: {
          owner: { managerId: userId }
        },
        include: { owner: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'ADMIN') {
      goals = await prisma.goal.findMany({
        include: { owner: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { ownerId, thrustArea, title, description, uom, target, weightage } = data;

    // Validate rules
    const existingGoals = await prisma.goal.findMany({ where: { ownerId } });
    if (existingGoals.length >= 8) {
      return NextResponse.json({ error: 'Maximum of 8 goals allowed' }, { status: 400 });
    }
    if (weightage < 10) {
      return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 });
    }

    const currentTotalWeightage = existingGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + weightage > 100) {
      return NextResponse.json({ error: `Total weightage cannot exceed 100%. Current: ${currentTotalWeightage}%` }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        ownerId,
        thrustArea,
        title,
        description,
        uom,
        target: parseFloat(target),
        weightage: parseFloat(weightage),
        status: 'DRAFT'
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Goal',
        entityId: goal.id,
        userId: ownerId,
        details: `Created goal "${title}"`
      }
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
