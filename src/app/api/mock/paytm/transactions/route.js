import { NextResponse } from 'next/server';
import { getPaytmTransactions, readDb, writeDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mid = searchParams.get('mid');

    if (!mid) {
      return NextResponse.json({ error: 'Merchant ID (mid) is required.' }, { status: 400 });
    }

    const transactions = getPaytmTransactions(mid);
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mid = searchParams.get('mid');
    
    const db = readDb();
    if (mid) {
      db.paytmTransactions = db.paytmTransactions.filter(tx => tx.paytmMID !== mid);
    } else {
      db.paytmTransactions = [];
    }
    writeDb(db);
    return NextResponse.json({ success: true, message: 'Simulator transactions cleared.' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  }
}
