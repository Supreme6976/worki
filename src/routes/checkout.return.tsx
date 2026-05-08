import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { getOrderBySession } from '@/lib/payments.functions';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/checkout/return')({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const fetchOrder = useServerFn(getOrderBySession);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!session_id) { setLoading(false); return; }
    let cancelled = false;
    let timer: any;

    const poll = async () => {
      try {
        const o = await fetchOrder({ data: { sessionId: session_id } });
        if (cancelled) return;
        setOrder(o);
        if (o?.status === 'paid' || o?.status === 'failed' || tries > 8) {
          setLoading(false);
        } else {
          timer = setTimeout(() => setTries((t) => t + 1), 1500);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [session_id, tries]);

  if (!session_id) {
    return (
      <Wrapper>
        <h1 className="text-2xl font-semibold">Nedostaju podaci o sesiji</h1>
        <Link to="/" className="mt-6 underline text-primary">Nazad na početnu</Link>
      </Wrapper>
    );
  }

  if (loading) {
    return (
      <Wrapper>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Obrada plaćanja...</h1>
        <p className="text-muted-foreground mt-2 text-sm">Sačekajte trenutak.</p>
      </Wrapper>
    );
  }

  const paid = order?.status === 'paid';
  return (
    <Wrapper>
      {paid ? (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold">Hvala na kupovini!</h1>
          <p className="text-muted-foreground mt-2">Vaša narudžbina <span className="font-mono text-foreground">{order.product_name}</span> je uspešno plaćena.</p>
          <p className="text-sm text-muted-foreground mt-1">Potvrdu šaljemo na vaš e-naslov.</p>
        </>
      ) : (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <h1 className="mt-4 text-3xl font-bold">Plaćanje nije uspelo</h1>
          <p className="text-muted-foreground mt-2">Pokušajte ponovo ili koristite drugu karticu.</p>
        </>
      )}
      <Link to="/" className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Nazad na početnu
      </Link>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {children}
    </div>
  );
}
