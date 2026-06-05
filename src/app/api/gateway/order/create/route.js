import { NextResponse } from 'next/server';
import { getMerchantByApiKey, createOrder } from '@/lib/db';

export async function POST(request) {
  try {
    // API key can be passed via Authorization header, x-api-key header, or body
    const authHeader = request.headers.get('authorization');
    let apiKey = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    } else {
      apiKey = request.headers.get('x-api-key') || '';
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    if (!apiKey && body.apiKey) {
      apiKey = body.apiKey;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Pass in Authorization header as Bearer token or x-api-key header.' },
        { status: 401 }
      );
    }

    const merchant = await getMerchantByApiKey(apiKey);
    if (!merchant) {
      return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
    }

    const { amount, orderId, customerName, redirectUrl } = body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required.' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Unique orderId is required.' }, { status: 400 });
    }

    const merchantUPI = merchant.paytmUPI || 'merchant@paytm';
    const businessName = merchant.businessName || 'BS Solutions Merchant';
    
    const gatewayOrderId = 'bs_' + Math.random().toString(36).substring(2, 9);
    
    // Construct standard UPI deep link
    const upiUrl = `upi://pay?pa=${encodeURIComponent(merchantUPI)}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tr=${gatewayOrderId}&tn=${encodeURIComponent('Payment for Order ' + orderId)}`;

    const newOrder = {
      id: gatewayOrderId,
      developerOrderId: orderId,
      merchantId: merchant.id,
      merchantBusinessName: businessName,
      merchantUPI,
      amount: Number(amount),
      customerName: customerName || 'Valued Customer',
      redirectUrl: redirectUrl || '',
      status: 'PENDING',
      upiUrl,
      paytmTxnId: '',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      logs: []
    };

    await createOrder(newOrder);

    const url = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || url.host;
    const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
    const checkoutUrl = `${proto}://${host}/pay/${gatewayOrderId}`;

    return NextResponse.json({
      success: true,
      orderId: gatewayOrderId,
      developerOrderId: orderId,
      amount: newOrder.amount,
      checkoutUrl,
      upiUrl
    });
  } catch (error) {
    console.error('Error creating gateway order:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
