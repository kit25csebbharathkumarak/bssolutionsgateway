import { NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { orderId } = await params;
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      developerOrderId: order.developerOrderId,
      amount: order.amount,
      status: order.status,
      paytmTxnId: order.paytmTxnId,
      createdAt: order.createdAt,
      verifiedAt: order.verifiedAt,
      upiUrl: order.upiUrl,
      redirectUrl: order.redirectUrl
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
