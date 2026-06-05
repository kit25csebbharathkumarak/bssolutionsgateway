import { NextResponse } from 'next/server';
import { getMerchantById, saveMerchant } from '@/lib/db';

export async function GET(request) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const merchant = await getMerchantById(merchantId);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    }

    const { password: _, ...merchantData } = merchant;
    return NextResponse.json({ merchant: merchantData });
  } catch (error) {
    console.error('Profile GET Error:', error);
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const merchant = await getMerchantById(merchantId);
    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
    }

    const body = await request.json();
    const { action, paytmMID, paytmMobile, paytmPassword, paytmUPI } = body;

    if (action === 'generate_key') {
      merchant.apiKey = 'bs_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await saveMerchant(merchant);
      return NextResponse.json({ success: true, apiKey: merchant.apiKey });
    }

    if (action === 'revoke_key') {
      merchant.apiKey = null;
      await saveMerchant(merchant);
      return NextResponse.json({ success: true, message: 'API key revoked.' });
    }

    // Default action: update Paytm config
    merchant.paytmMID = paytmMID || '';
    merchant.paytmMobile = paytmMobile || '';
    merchant.paytmPassword = paytmPassword || '';
    merchant.paytmUPI = paytmUPI || '';

    await saveMerchant(merchant);
    return NextResponse.json({ success: true, message: 'Paytm credentials updated successfully.' });
  } catch (error) {
    console.error('Profile POST Error:', error);
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
