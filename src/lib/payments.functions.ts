import { createServerFn } from '@tanstack/react-start';
import { type StripeEnv, createStripeClient } from './stripe.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    productId: string;
    customerName: string;
    customerEmail: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Neispravan priceId');
    if (!data.customerEmail || !data.customerEmail.includes('@')) throw new Error('Neispravan email');
    if (!data.customerName || data.customerName.trim().length < 2) throw new Error('Neispravno ime');
    return data;
  })
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error('Cena nije pronađena');
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === 'recurring';

    // Učitaj proizvod iz baze
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, price_cents, currency')
      .eq('id', data.productId)
      .single();
    if (prodErr || !product) throw new Error('Proizvod nije pronađen');

    // Kreiraj pending narudžbinu unapred
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        product_id: product.id,
        product_name: product.name,
        amount_cents: product.price_cents,
        currency: product.currency,
        status: 'pending',
      })
      .select('id')
      .single();
    if (orderErr || !order) throw new Error('Greška pri kreiranju narudžbine');

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? 'subscription' : 'payment',
      ui_mode: 'embedded_page',
      return_url: data.returnUrl,
      customer_email: data.customerEmail,
      metadata: {
        order_id: order.id,
        product_id: product.id,
        ...(userId ? { userId: userId } : {}),
      },
      ...(isRecurring && {
        subscription_data: {
          metadata: {
            order_id: order.id,
            product_id: product.id,
            ...(userId ? { userId: userId } : {}),
          },
        },
      }),
    });

    // Sačuvaj session ID na narudžbinu
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return session.client_secret;
  });

export const getOrderBySession = createServerFn({ method: 'GET' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, status, product_name, amount_cents, currency')
      .eq('stripe_session_id', data.sessionId)
      .maybeSingle();
    return order;
  });
