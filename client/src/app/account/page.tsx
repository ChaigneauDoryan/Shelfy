'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AvatarUpload from '@/components/AvatarUpload'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
          setUsername(data.username || '');
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      }
      setLoading(false);
    };

    fetchUserAndProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const updates = {
      id: user.id,
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(updates)

    if (error) {
      alert(error.message)
    } else {
      alert('Profil mis à jour avec succès !')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Veuillez vous connecter pour accéder à cette page.</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mon Compte</CardTitle>
          <CardDescription>Gérez les informations de votre profil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload
            userId={user.id}
            initialAvatarUrl={avatarUrl}
            onUpload={(url) => setAvatarUrl(url)}
          />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleUpdateProfile}>Enregistrer les modifications</Button>
        </CardContent>
      </Card>
    </div>
  );
}