import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const returnReq = await db.returnRequest.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, email: true, customerCode: true, userId: true } },
        salesOrder: { select: { orderNumber: true, items: { include: { product: true } } } },
      },
    });
    if (!returnReq) return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    return NextResponse.json(returnReq);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, adminNote, refundAmount, refundNote } = body;

    const existing = await db.returnRequest.findUnique({
      where: { id },
      include: { customer: { select: { userId: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Return request not found' }, { status: 404 });

    const updateData: any = { adminNote: adminNote ?? existing.adminNote };
    const now = new Date();

    switch (status) {
      case 'APPROVED':
        updateData.status = 'APPROVED';
        updateData.approvedAt = now;
        break;
      case 'REJECTED':
        updateData.status = 'REJECTED';
        updateData.rejectedAt = now;
        break;
      case 'PICKED_UP':
        updateData.status = 'PICKED_UP';
        updateData.pickedUpAt = now;
        break;
      case 'REFUNDED':
        updateData.status = 'REFUNDED';
        updateData.refundedAt = now;
        updateData.refundAmount = refundAmount ? Number(refundAmount) : existing.refundAmount;
        updateData.refundNote = refundNote ?? existing.refundNote;
        break;
      default:
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await db.returnRequest.update({ where: { id }, data: updateData });

    // Notify customer
    if (existing.customer.userId) {
      const messages: Record<string, string> = {
        APPROVED: `Your return request ${existing.returnNumber} has been approved.`,
        REJECTED: `Your return request ${existing.returnNumber} has been rejected.${adminNote ? ' Reason: ' + adminNote : ''}`,
        PICKED_UP: `Your return for ${existing.returnNumber} has been picked up.`,
        REFUNDED: `Refund of ₹${refundAmount || existing.refundAmount || 0} has been processed for ${existing.returnNumber}.`,
      };
      await db.notification.create({
        data: {
          userId: existing.customer.userId,
          title: `Return ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          message: messages[status] || '',
          type: 'RETURN',
          referenceId: id,
          referenceType: 'ReturnRequest',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
