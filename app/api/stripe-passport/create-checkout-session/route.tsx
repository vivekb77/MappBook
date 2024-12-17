import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { track } from '@vercel/analytics/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PASSPORT,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 5,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success-passport?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      customer_email: userEmail,
      metadata: {
        userId: userId.toString(), // Ensure userId is a string
      },
    });
    await track('Passport - Checkout session created', {
      userId: userId.toString(),
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    await track('RED - Passport - Error creating checkout session');
    console.error('Error creating checkout session:', err);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}