import { NextResponse } from 'next/server';
import { verifyOrderWithPaytm } from '@/lib/paytmVerifier';

export async function POST(request, { params }) {
  try {
    const { orderId } = await params;
    const result = await verifyOrderWithPaytm(orderId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying order:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
