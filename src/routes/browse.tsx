import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout, PageHeader } from '@/components/Layout';
import { JobCard } from '@/components/JobCard';
import { useState } from 'react';

const cities = ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Koper', 'Velenje', 'Novo Mesto', 'Ptuj'];
const cats = ['Čiščenje', 'Selitev', 'Pomoč doma', 'Vrtnarstvo', 'Montaža pohištva', 'Dostava', 'Ostalo'];

export const Route = createFileRoute('/browse')({
  validateSearch: (s: Record<string, unknown>) => ({
    city: typeof s.city === 'string' ? s.city : '',
    category: typeof s.category === 'string' ? s.category : '',
    price: typeof s.price === 'string' ? s.price : '',
  }),
  head: () => ({ meta: [{ title: 'Iskanje del — Worki' }] }),
  component: Browse,
});

function Browse() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [city, setCity] = useState(search.city);
  const [category, setCategory] = useState(search.category);
  const [price, setPrice] = useState(search.price);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', city, category, price],
    queryFn: async () => {
      let q = supabase.from('jobs').select('id, title, description, city, category, job_date, job_time, price_cents, currency, contact_name, status, posted_by, created_at, updated_at').eq('status', 'active');
      if (city) q = q.eq('city', city);
      if (category) q = q.eq('category', category);
      if (price === '0-25') q = q.lte('price_cents', 2500);
      else if (price === '25-50') q = q.gte('price_cents', 2500).lte('price_cents', 5000);
      else if (price === '50-100') q = q.gte('price_cents', 5000).lte('price_cents', 10000);
      else if (price === '100+') q = q.gte('price_cents', 10000);
      const { data } = await q.order('created_at', { ascending: false });
      return data || [];
    },
  });

  const update = (patch: any) => nav({ search: { city, category, price, ...patch } as any, replace: true });

  return (
    <Layout>
      <PageHeader title="Iskanje del" subtitle="Najdi priložnost za delo v svoji bližini" />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-5">
          <select value={city} onChange={(e) => { setCity(e.target.value); update({ city: e.target.value }); }} className="px-3 py-2 border-2 border-border rounded-md text-sm bg-card">
            <option value="">Vsa mesta</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); update({ category: e.target.value }); }} className="px-3 py-2 border-2 border-border rounded-md text-sm bg-card">
            <option value="">Vse kategorije</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={price} onChange={(e) => { setPrice(e.target.value); update({ price: e.target.value }); }} className="px-3 py-2 border-2 border-border rounded-md text-sm bg-card">
            <option value="">Katera koli cena</option>
            <option value="0-25">Do 25 €</option>
            <option value="25-50">25 € – 50 €</option>
            <option value="50-100">50 € – 100 €</option>
            <option value="100+">100 €+</option>
          </select>
          {(city || category || price) && (
            <button onClick={() => { setCity(''); setCategory(''); setPrice(''); nav({ search: {} as any }); }} className="bg-secondary px-3 py-2 rounded-md text-sm font-semibold">Počisti</button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">{jobs?.length || 0} {jobs?.length === 1 ? 'delo' : 'del'} najdenih</p>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Nalaganje...</div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((j: any) => <JobCard key={j.id} job={j} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Ni del za izbrane filtre. <Link to="/post" className="text-primary underline">Objavi prvo delo!</Link></div>
        )}
      </div>
    </Layout>
  );
}
