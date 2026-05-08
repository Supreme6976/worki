import { createFileRoute, Link } from '@tanstack/react-router';
import { Layout, AuthGate } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowLeft } from 'lucide-react';

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4); // 0-4
}
const STRENGTH = [
  { label: 'Zelo šibko', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Šibko', color: 'bg-orange-500', text: 'text-orange-500' },
  { label: 'Srednje', color: 'bg-yellow-500', text: 'text-yellow-500' },
  { label: 'Dobro', color: 'bg-lime-500', text: 'text-lime-500' },
  { label: 'Močno', color: 'bg-green-500', text: 'text-green-500' },
];

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: 'Nastavitve — Worki' }] }),
  component: () => <Layout><AuthGate><Settings /></AuthGate></Layout>,
});

function Settings() {
  const { user, profile, reload } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, phone: phone || null, bio: bio || null })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profil shranjen');
      await reload();
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return toast.error('Manjka e-naslov');
    if (!currentPassword) return toast.error('Vnesi trenutno geslo');
    if (newPassword.length < 8) return toast.error('Novo geslo mora imeti vsaj 8 znakov');
    if (newPassword !== confirmPassword) return toast.error('Gesli se ne ujemata');
    if (newPassword === currentPassword) return toast.error('Novo geslo mora biti drugačno od trenutnega');
    setSavingPassword(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) {
        toast.error('Trenutno geslo ni pravilno');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Geslo posodobljeno');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally {
      setSavingPassword(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) return toast.error('Vnesi nov e-naslov');
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/settings` }
      );
      if (error) throw error;
      toast.success('Potrditveni povezavi sta bili poslani na star in nov e-naslov. Klikni obe za dokončanje spremembe.');
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Napaka');
    } finally {
      setSavingEmail(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const EXT_MAP: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Dovoljene so samo JPG, PNG, GIF ali WEBP slike');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('Slika presega 5MB');
      return;
    }
    setUploading(true);
    try {
      const ext = EXT_MAP[file.type];
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: profErr } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id);
      if (profErr) throw profErr;
      toast.success('Slika posodobljena');
      await reload();
    } catch (err: any) {
      toast.error(err.message || 'Napaka pri nalaganju');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> Nazaj na profil
      </Link>

      <h1 className="text-2xl font-extrabold mb-6">Nastavitve</h1>

      {/* Avatar */}
      <section className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Camera className="h-4 w-4" /> Profilna slika</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden grid place-items-center border border-border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Nalagam…' : 'Naloži novo sliko'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG ali GIF. Maks 5MB.</p>
          </div>
        </div>
      </section>

      {/* Profile info */}
      <section className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-4 flex items-center gap-2"><UserIcon className="h-4 w-4" /> Osebni podatki</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <Label htmlFor="email">E-pošta (trenutna)</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>
          <div>
            <Label htmlFor="name">Ime in priimek</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+386 ..." />
          </div>
          <div>
            <Label htmlFor="bio">O meni</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Nekaj besed o sebi..." />
          </div>
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Shranjujem…' : 'Shrani spremembe'}
          </Button>
        </form>
      </section>

      {/* Email change */}
      <section className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-bold mb-1 flex items-center gap-2"><Mail className="h-4 w-4" /> Spremeni e-pošto</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Po shranjevanju ti bomo poslali potrditveno povezavo na nov e-naslov (in na star, če je potrjevanje vklopljeno). Sprememba začne veljati šele po potrditvi.
        </p>
        <form onSubmit={changeEmail} className="space-y-4">
          <div>
            <Label htmlFor="newemail">Nov e-naslov</Label>
            <Input id="newemail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nov@email.si" required />
          </div>
          <Button type="submit" disabled={savingEmail}>
            {savingEmail ? 'Pošiljam…' : 'Pošlji potrditveno povezavo'}
          </Button>
        </form>
      </section>

      {/* Password */}
      <PasswordSection
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        savingPassword={savingPassword}
        changePassword={changePassword}
      />
    </div>
  );
}

function PasswordSection({
  currentPassword, setCurrentPassword,
  newPassword, setNewPassword, confirmPassword, setConfirmPassword, savingPassword, changePassword,
}: {
  currentPassword: string; setCurrentPassword: (v: string) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  savingPassword: boolean; changePassword: (e: React.FormEvent) => void;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const score = scorePassword(newPassword);
  const meta = STRENGTH[score];
  const match = confirmPassword.length > 0 && newPassword === confirmPassword;
  const mismatch = confirmPassword.length > 0 && !match;

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h2 className="font-bold mb-4 flex items-center gap-2"><Lock className="h-4 w-4" /> Spremeni geslo</h2>
      <form onSubmit={changePassword} className="space-y-4">
        <div>
          <Label htmlFor="curpass">Trenutno geslo</Label>
          <div className="relative">
            <Input
              id="curpass"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? 'Skrij geslo' : 'Pokaži geslo'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="newpass">Novo geslo</Label>
          <div className="relative">
            <Input
              id="newpass"
              type={showNew ? 'text' : 'password'}
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Najmanj 8 znakov"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? 'Skrij geslo' : 'Pokaži geslo'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 h-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors ${i < Math.max(score, 1) ? meta.color : 'bg-muted'}`}
                  />
                ))}
              </div>
              <div className={`text-xs mt-1 font-medium ${meta.text}`}>{meta.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Priporočeno: 12+ znakov, velike in male črke, številka in poseben znak.
              </div>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="confpass">Potrdi novo geslo</Label>
          <div className="relative">
            <Input
              id="confpass"
              type={showConf ? 'text' : 'password'}
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConf((s) => !s)}
              aria-label={showConf ? 'Skrij geslo' : 'Pokaži geslo'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && <div className="text-xs mt-1 text-red-500">Gesli se ne ujemata</div>}
          {match && <div className="text-xs mt-1 text-green-600">Gesli se ujemata ✓</div>}
        </div>
        <Button type="submit" disabled={savingPassword || !currentPassword || score < 1 || !match}>
          {savingPassword ? 'Posodabljam…' : 'Posodobi geslo'}
        </Button>
      </form>
    </section>
  );
}

