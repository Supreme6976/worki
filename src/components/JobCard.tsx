import { Link } from '@tanstack/react-router';
import { MapPin, Calendar, Tag } from 'lucide-react';

interface JobCardJob {
  id: string;
  title: string;
  description: string;
  city: string;
  category: string;
  job_date: string | null;
  price_cents: number;
  currency: string;
  created_at: string;
}

const catColors: Record<string, string> = {
  'Čiščenje': 'bg-blue-100 text-blue-800',
  'Selitev': 'bg-green-100 text-green-800',
  'Pomoč doma': 'bg-orange-100 text-orange-800',
  'Vrtnarstvo': 'bg-emerald-100 text-emerald-800',
  'Montaža pohištva': 'bg-purple-100 text-purple-800',
  'Dostava': 'bg-rose-100 text-rose-800',
  'Ostalo': 'bg-slate-100 text-slate-800',
};

export function JobCard({ job }: { job: JobCardJob }) {
  const isNew = Date.now() - new Date(job.created_at).getTime() < 24 * 3600 * 1000;
  return (
    <Link to="/jobs/$jobId" params={{ jobId: job.id }} className="block group">
      <article className="card-lift bg-card border border-border rounded-2xl p-5 hover:border-primary h-full">
        <div className="flex justify-between items-start gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${catColors[job.category] || catColors['Ostalo']}`}>
            {job.category}
          </span>
          <span className="text-lg font-extrabold text-primary">
            {(job.price_cents / 100).toLocaleString('sl-SI', { style: 'currency', currency: job.currency.toUpperCase() })}
          </span>
        </div>
        <h3 className="font-bold text-base text-foreground mb-1 line-clamp-2">{job.title}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}</span>
          {job.job_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(job.job_date).toLocaleDateString('sl-SI')}</span>}
          {isNew && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">NOVO</span>}
        </div>
      </article>
    </Link>
  );
}
