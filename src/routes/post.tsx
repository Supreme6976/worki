import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Layout, AuthGate } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { createJobAndCheckout } from '@/lib/jobs.functions';
import { getStripeEnvironment } from '@/lib/stripe';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const cities = ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Koper', 'Velenje', 'Novo Mesto', 'Ptuj'];
const cats = ['Čiščenje', 'Selitev', 'Pomoč doma', 'Vrtnarstvo', 'Montaža pohištva', 'Dostava', 'Ostalo'];

export const Route = createFileRoute('/post')({
  head: () => ({ meta: [{ title: 'Objavi delo — Worki' }] }),
  component: () => <Layout><AuthGate><PostPage /></AuthGate></Layout>,
});

function PostPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', city: '', category: '',
    job_date: '', job_time: '', price: '',
    contact_name: profile?.name || '', contact_info: '',
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const create = useServerFn(createJobAndCheckout);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await create({
        data: {
          job: {
            title: form.title,
            description: form.description,
            city: form.city,
            category: form.category,
            job_date: form.job_date || null,
            job_time: form.job_time || null,
            price_cents: Math.round(parseFloat(form.price) * 100),
            contact_name: form.contact_name,
            contact_info: form.contact_info,
          },
          returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          environment: getStripeEnvironment(),
        },
      });
      if (!result.clientSecret) throw new Error('Ni client_secret');
      setClientSecret(result.clientSecret);
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally { setLoading(false); }
  };

  if (clientSecret) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-extrabold mb-4">Plačilo objave — 2,00 €</h1>
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret: async () => clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold mb-1">Objavi delo</h1>
        <p className="text-sm text-muted-foreground mb-5">Izpolni podatke — delavci se bodo prijavili.</p>
        <div className="bg-gradient-to-br from-[#070D1A] to-[#1D3461] text-white rounded-xl p-4 mb-5 flex justify-between items-center">
          <div>
            <div className="text-xs text-white/60 font-semibold">Strošek objave</div>
            <div className="text-2xl font-extrabold">2,00 €</div>
          </div>
          <div className="text-3xl">💳</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Naslov dela *</Label><Input required minLength={5} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="npr. Pomoč pri selitvi" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Mesto *</Label><select required className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm" value={form.city} onChange={(e) => update('city', e.target.value)}><option value="">Izberi</option>{cities.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><Label>Kategorija *</Label><select required className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm" value={form.category} onChange={(e) => update('category', e.target.value)}><option value="">Izberi</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Datum</Label><Input type="date" value={form.job_date} onChange={(e) => update('job_date', e.target.value)} /></div>
            <div><Label>Ura</Label><Input type="time" value={form.job_time} onChange={(e) => update('job_time', e.target.value)} /></div>
          </div>
          <div><Label>Opis dela *</Label><Textarea required minLength={10} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Opiši delo podrobno..." className="min-h-[100px]" /></div>
          <div><Label>Cena (EUR) *</Label><Input required type="number" min="1" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="45" /></div>
          <div className="border-t border-border pt-4 grid sm:grid-cols-2 gap-3">
            <div><Label>Tvoje ime *</Label><Input required value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} /></div>
            <div><Label>Telefon / E-pošta *</Label><Input required value={form.contact_info} onChange={(e) => update('contact_info', e.target.value)} placeholder="041 123 456" /></div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Trenutek...' : 'Nadaljuj na plačilo — 2,00 € →'}</Button>
          <p className="text-xs text-center text-muted-foreground">🔒 Varno plačilo · Kartica</p>
        </form>
      </div>
    </div>
  );
}
