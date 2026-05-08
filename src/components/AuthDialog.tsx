import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Briefcase, HardHat, ArrowLeft } from 'lucide-react';
import workiLogo from '@/assets/worki-logo.png';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: 'login' | 'register';
  setMode: (m: 'login' | 'register') => void;
}

type View = 'auth' | 'reset';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

export function AuthDialog({ open, onOpenChange, mode, setMode }: Props) {
  const [view, setView] = useState<View>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'worker'>('client');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Dobrodošel nazaj!');
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name, role },
          },
        });
        if (error) throw error;
        toast.success('Račun ustvarjen! Lahko se prijaviš.');
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
  };

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast.success('Preveri e-pošto za navodila za ponastavitev gesla.');
      setView('auth');
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/60">
        <div className="bg-gradient-to-br from-[#0B1224] via-[#1D3461] to-[#1a56a8] text-white px-6 pt-7 pb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'radial-gradient(400px circle at 50% 0%, rgba(138,180,255,0.35), transparent 65%)' }} />
          <DialogHeader className="relative">
            <DialogTitle className="font-display text-3xl font-bold tracking-tight text-white flex justify-center">
              <img src={workiLogo} alt="Worki" className="h-12 w-auto" />
            </DialogTitle>
          </DialogHeader>
          <p className="relative text-sm text-white/70 mt-1">
            {view === 'reset' ? 'Ponastavi geslo' : mode === 'login' ? 'Dobrodošel nazaj' : 'Začni svojo pot'}
          </p>
        </div>

        <div className="p-6 pt-5 space-y-4">
          {view === 'reset' ? (
            <>
              <button onClick={() => setView('auth')} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground btn-press">
                <ArrowLeft className="h-3 w-3" /> Nazaj
              </button>
              <form onSubmit={sendReset} className="space-y-3">
                <div>
                  <Label htmlFor="rmail">E-pošta</Label>
                  <Input id="rmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ti@email.si" />
                </div>
                <Button type="submit" className="w-full glow-cta" disabled={loading}>
                  {loading ? 'Pošiljam…' : 'Pošlji povezavo za ponastavitev'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                <button type="button" onClick={() => setMode('login')} className={`py-2 text-sm font-semibold rounded-md transition ${mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Prijava</button>
                <button type="button" onClick={() => setMode('register')} className={`py-2 text-sm font-semibold rounded-md transition ${mode === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Registracija</button>
              </div>

              <Button type="button" variant="outline" className="w-full btn-press gap-2 font-semibold" onClick={google}>
                <GoogleIcon /> Nadaljuj z Google
              </Button>

              <div className="relative text-center text-xs text-muted-foreground">
                <span className="bg-background px-3 relative z-10">ali z e-pošto</span>
                <div className="absolute inset-0 top-1/2 h-px bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-3">
                {mode === 'register' && (
                  <>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Želim:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setRole('client')} className={`p-3 rounded-xl border-2 text-left transition card-lift ${role === 'client' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <Briefcase className="h-5 w-5 mb-1 text-primary" />
                        <div className="font-semibold text-sm">Objavljati dela</div>
                        <div className="text-xs text-muted-foreground">Sem naročnik</div>
                      </button>
                      <button type="button" onClick={() => setRole('worker')} className={`p-3 rounded-xl border-2 text-left transition card-lift ${role === 'worker' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <HardHat className="h-5 w-5 mb-1 text-primary" />
                        <div className="font-semibold text-sm">Iskati delo</div>
                        <div className="text-xs text-muted-foreground">Sem delavec</div>
                      </button>
                    </div>
                    <div>
                      <Label htmlFor="name">Ime in priimek</Label>
                      <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Janez Novak" />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="email">E-pošta</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ti@email.si" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Geslo</Label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => setView('reset')} className="text-xs text-primary hover:underline font-medium">
                        Pozabljeno geslo?
                      </button>
                    )}
                  </div>
                  <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Najmanj 8 znakov" />
                </div>
                <Button type="submit" className="w-full glow-cta font-semibold" disabled={loading}>
                  {loading ? 'Trenutek…' : mode === 'login' ? 'Prijava →' : 'Ustvari račun →'}
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
