import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { track } from '@vercel/analytics/server';
import { getSupabaseAdmin } from '@/components/utils/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No stripe signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
        throw new Error('No userId found in session metadata');
      }

      // Determine which product was purchased based on the price ID or product ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      const supabase = getSupabaseAdmin();

      if (priceId === process.env.STRIPE_PRICE_ID_DRONE) {
        // Handle Drone credits

        const credit_quantity = Math.round(session.amount_total! * 0.05); //25 credits for $5

        const { data, error } = await supabase
          .rpc('add_drone_credits_fcb5e877d4ee', {
            m_user_id: userId,
            quantity: credit_quantity,
          });

        if (error) {
          await track('RED - Drone webhook- Error adding Drone credits');
          console.error('Error adding Drone credits:', error);
          throw error;
        }
      } else if (priceId === process.env.STRIPE_PRICE_ID) {
        if (session.payment_status !== 'paid') {
          throw new Error('Payment not completed');
        }
        const views_quantity = Math.round(session.amount_total! / 1000);

        const { data, error } = await supabase
          .rpc('update_premium_user_fcb5e877d4ee', {
            m_user_id: userId,
            quantity: views_quantity,
          });

        if (error) {
          await track('RED - webhook- Error adding mappbook views');
          console.error('Error updating premium user:', error);
        } else {
          // console.log('Successfully updated premium user status', data);
        }
      }

    }
    return NextResponse.json({ success: true });
  }
    
 catch (err) {
  await track('RED - webhook- Error processing webhook');
  console.error('Error processing webhook:', err);
  return NextResponse.json(
    { error: 'Error processing webhook: ' + err },
    { status: 500 }
  );
}
}
// stripe listen --forward-to localhost:3000/api/stripe/webhook