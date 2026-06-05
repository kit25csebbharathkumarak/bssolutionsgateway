import { NextResponse } from 'next/server';
import { getMerchantByEmail } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const merchant = await getMerchantByEmail(email);
    if (!merchant || merchant.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { password: _, ...merchantData } = merchant;
    return NextResponse.json({ success: true, merchant: merchantData });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}
