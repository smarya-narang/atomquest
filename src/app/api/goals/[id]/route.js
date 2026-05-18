import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { action, userId, ...updates } = data; // action can be 'SUBMIT', 'APPROVE', 'RETURN', 'UPDATE_WEIGHTAGE'

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    if (goal.status === 'APPROVED' && action !== 'ADMIN_EDIT') {
      return NextResponse.json({ error: 'Goal is locked and cannot be edited' }, { status: 400 });
    }

    let updatedGoal;

    if (action === 'SUBMIT') {
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: { status: 'PENDING' }
      });
    } else if (action === 'APPROVE') {
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
    } else if (action === 'RETURN') {
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: { status: 'RETURNED' }
      });
    } else if (action === 'UPDATE_WEIGHTAGE') {
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: { weightage: parseFloat(updates.weightage) }
      });
    } else {
      updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          thrustArea: updates.thrustArea || goal.thrustArea,
          title: updates.title || goal.title,
          description: updates.description !== undefined ? updates.description : goal.description,
          uom: updates.uom || goal.uom,
          target: updates.target !== undefined ? parseFloat(updates.target) : goal.target,
          weightage: updates.weightage !== undefined ? parseFloat(updates.weightage) : goal.weightage,
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        action: action || 'UPDATE',
        entityType: 'Goal',
        entityId: goal.id,
        userId: userId || goal.ownerId,
        details: `Goal updated via action ${action || 'general update'}`
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    if (goal.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot delete approved goals' }, { status: 400 });
    }

    await prisma.goal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
