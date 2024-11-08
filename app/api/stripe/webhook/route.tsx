import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getClerkSupabaseClient } from "@/components/utils/supabase";
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

      // Calculate quantity based on total amount
      const quantity = Math.round(session.amount_total! / 1000);

      // console.log("Session metadata: ", JSON.stringify(session));
      // console.log("Calculated quantity: ", quantity);

      if (!userId) {
        throw new Error('No userId found in session metadata');
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .rpc('update_premium_user_fcb5e877d4ee', {
          m_user_id: userId,
          quantity: quantity,
        });
      
        if (error) {
          console.error('Error updating premium user:', error);
        } else {
          // console.log('Successfully updated premium user status', data);
        }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    
    return NextResponse.json(
      { error: 'Error processing webhook' + err},
      { status: 500 }
    );
  }

}