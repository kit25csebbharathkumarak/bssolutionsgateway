import { NextResponse } from 'next/server';
import { getMerchantByEmail, saveMerchant } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, businessName } = body;

    if (!email || !password || !businessName) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const existing = getMerchantByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    const newMerchant = {
      id: 'mer_' + Math.random().toString(36).substring(2, 9),
      email,
      password, // Stored as plain text for self-contained demonstration
      businessName,
      apiKey: null,
      paytmMID: '',
      paytmMobile: '',
      paytmPassword: '',
      paytmUPI: '',
      createdAt: new Date().toISOString()
    };

    saveMerchant(newMerchant);

    // Remove password from response
    const { password: _, ...merchantData } = newMerchant;
    return NextResponse.json({ success: true, merchant: merchantData });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}
