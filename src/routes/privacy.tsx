import { createFileRoute, Link } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Zasebnost — Worki' }] }),
  component: () => (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-5"><ArrowLeft className="h-4 w-4" /> Nazaj</Link>
        <div className="bg-gradient-to-br from-[#070D1A] to-[#1D3461] text-white rounded-3xl p-10 mb-6 text-center">
          <h1 className="text-3xl font-extrabold mb-2">Politika zasebnosti</h1>
          <p className="text-white/60">Kako zbiramo, uporabljamo in varujemo tvoje osebne podatke</p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            ['1. Kdo smo', 'Worki d.o.o., Trubarjeva 50, 1000 Ljubljana. Kontakt: zasebnost@worki.si.'],
            ['2. Katere podatke zbiramo', 'Podatke o računu (ime, e-pošta), objave del, prijave, podatke o napravi za varnost.'],
            ['3. Kako uporabljamo podatke', 'Za upravljanje računa, posredovanje med naročniki in delavci, obdelavo plačil. Tvojih podatkov ne prodajamo.'],
            ['4. Tvoje pravice (GDPR)', 'Pravica do dostopa, popravka, izbrisa, omejitve obdelave. Pišite na zasebnost@worki.si.'],
            ['5. Varnost', 'Gesla so šifrirana. HTTPS povsod. Plačila prek PCI-DSS procesorjev.'],
          ].map(([t, c]) => (
            <div key={t} className="bg-card border border-border rounded-2xl p-6"><h2 className="font-extrabold text-foreground mb-2">{t}</h2><p>{c}</p></div>
          ))}
        </div>
      </div>
    </Layout>
  ),
});
