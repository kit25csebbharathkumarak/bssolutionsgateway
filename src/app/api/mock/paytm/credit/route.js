import { NextResponse } from 'next/server';
import { addPaytmTransaction } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { paytmMID, amount, senderName } = body;

    if (!paytmMID || !amount) {
      return NextResponse.json({ error: 'paytmMID and amount are required.' }, { status: 400 });
    }

    const txnId = 'PTM' + Date.now() + Math.floor(Math.random() * 1000);
    const newTx = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      paytmMID,
      amount: Number(amount),
      senderName: senderName || 'UPI User',
      txnId,
      createdAt: new Date().toISOString(),
      isClaimed: false
    };

    addPaytmTransaction(newTx);
    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}
