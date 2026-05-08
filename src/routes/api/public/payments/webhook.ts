import { createFileRoute } from '@tanstack/react-router';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

async function handleCheckoutCompleted(session: any) {
  const orderId = session.metadata?.order_id;
  const jobId = session.metadata?.job_id;
  if (!orderId) {
    console.error('checkout.session.completed bez order_id metadata');
    return;
  }
  const paid = session.payment_status === 'paid' || session.status === 'complete';
  await supabaseAdmin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'pending',
      stripe_payment_intent_id: session.payment_intent || null,
    })
    .eq('id', orderId);
  if (paid && jobId) {
    await supabaseAdmin.from('jobs').update({ status: 'active' }).eq('id', jobId);
  }
}

async function handleSessionExpired(session: any) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
}

async function handleChargeRefunded(charge: any) {
  const pi = charge.payment_intent;
  if (!pi) return;
  await supabaseAdmin.from('orders').update({ status: 'refunded' }).eq('stripe_payment_intent_id', pi);
}

async function handlePaymentFailed(pi: any) {
  await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('stripe_payment_intent_id', pi.id);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      await handleSessionExpired(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    default:
      console.log('Unhandled event:', event.type);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('Webhook bez validnog env query parametra:', rawEnv);
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
