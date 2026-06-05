import { NextResponse } from 'next/server';
import { getMerchantOrders } from '@/lib/db';

export async function GET(request) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const orders = getMerchantOrders(merchantId);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
